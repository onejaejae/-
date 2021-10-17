import mongoose from "mongoose";
import Review from "../models/Review";
import Theater from "../models/Theater";
import User from "../models/User";
import Show from "../models/Show";
import Like from "../models/Like";
import throwError from "../utils/throwError";

export const getReviewDetail = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    if (!mongoose.isValidObjectId(reviewId)) {
      return next(throwError(400, "reviewId가 유효하지 않습니다."));
    }

    const review = await Review.findById(reviewId, {
      likes: 0,
      fcltynm: 0,
      mt20id: 0,
      prfnm: 0,
    }).populate("show");
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

export const postReview = async (req, res, next) => {
  try {
    const { fcltynm, mt20id } = req.body;

    const user = await User.findById(req.id);
    const show = await Show.findOne({ mt20id });
    const result =
      (show.totalRating + req.body.reviewRating) / (show.reviewNumber + 1);

    req.body.writer = user;
    req.body.show = show.id;
    const newReview = new Review(req.body);

    const [review] = await Promise.all([
      newReview.save(),
      Theater.updateOne(
        { name: fcltynm },
        {
          $inc: { reviewCount: 1 },
          $push: { review: { $each: [newReview], $slice: -10 } },
        }
      ),
      User.updateOne(
        { _id: req.id },
        {
          $push: {
            postReview: {
              $each: [newReview],
              $slice: -10,
            },
          },
        }
      ),
      Show.updateOne(
        { mt20id },
        {
          $inc: { reviewNumber: 1 },
          rating: result.toFixed(1),
          totalRating: show.totalRating + req.body.reviewRating,
        }
      ),
    ]);

    res.status(200).json({ success: true, review });
  } catch (error) {
    next(error);
  }
};

export const patchReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    if (!mongoose.isValidObjectId(reviewId)) {
      return next(throwError(400, "reviewId가 유효하지 않습니다."));
    }

    const updateReview = await Review.findByIdAndUpdate(reviewId, req.body, {
      new: true,
    });
    res.status(200).json({ success: true, data: updateReview });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { mt20id } = req.query;

    if (!mongoose.isValidObjectId(reviewId)) {
      return next(throwError(400, "reviewId가 유효하지 않습니다."));
    }
    if (!mt20id) {
      return next(throwError(400, "query에 mt20id이 없습니다."));
    }

    const [review, show, user] = await Promise.all([
      Review.findById(reviewId),
      Show.findOne({ mt20id }),
      User.findById(req.id),
    ]);

    const theater = await Theater.findOne({ name: review.fcltynm });

    const totalRating = show.totalRating - review.reviewRating;
    const rating = totalRating / (show.reviewNumber - 1);

    if (user.postReview.find((r) => r.id === reviewId)) {
      user.postReview = user.postReview.filter((r) => r.id !== reviewId);
      if (user.postReview.length > 0) {
        const newReview = await Review.findOne({
          "writer._id": req.id,
          _id: { $lt: user.postReview[0].id },
        }).sort({ _id: -1 });
        if (newReview) user.postReview.unshift(newReview);
      }
    }

    if (theater.review.find((r) => r.id === reviewId)) {
      theater.review = theater.review.filter((r) => r.id !== reviewId);
      if (theater.review.length > 0) {
        const newReview = await Review.findOne({
          fcltynm: theater.name,
          _id: { $lt: theater.review[0].id },
        }).sort({ _id: -1 });
        if (newReview) theater.review.unshift(newReview);
      }
    }

    await Promise.all([
      user.save(),
      theater.save(),
      Review.findByIdAndDelete(reviewId),
      Show.updateOne(
        { mt20id: review.mt20id },
        {
          rating: rating.toFixed(1),
          totalRating,
          $inc: {
            reviewNumber: -1,
          },
        }
      ),
    ]);

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const patchLike = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    if (!mongoose.isValidObjectId(reviewId)) {
      return next(throwError(400, "reviewId가 유효하지 않습니다."));
    }

    const like = new Like({ userId: req.id, reviewId });
    const review = await Review.findById(reviewId);

    await Promise.all([
      like.save(),
      Review.findByIdAndUpdate(
        reviewId,
        {
          $inc: { likeNumber: 1 },
        },
        { new: true }
      ),
      User.findByIdAndUpdate(req.id, {
        $push: { likeReview: { $each: [review], $slice: -10 } },
      }),
    ]);

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const patchUnlike = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    if (!mongoose.isValidObjectId(reviewId)) {
      return next(throwError(400, "reviewId가 유효하지 않습니다."));
    }

    const [user, like] = await Promise.all([
      User.findById(req.id),
      Like.findOne({ reviewId }),
    ]);

    if (user.likeReview.find((r) => r.id === reviewId)) {
      console.log("heeloio");
      user.likeReview = user.likeReview.filter((r) => r.id !== reviewId);
      if (user.likeReview.length > 0) {
        const newReview = await Like.findOne({
          userId: req.id,
          _id: { $lt: user.likeReview[0].id },
        })
          .sort({ _id: -1 })
          .populate("reviewId");
        console.log(newReview);
        // if (newReview) user.postReview.unshift(newLike);
      }
    }

    //  await Promise.all([
    //       Like.findByIdAndDelete(likeId),
    //       Review.findByIdAndUpdate(
    //         like.reviewId,
    //         {
    //           $inc: { likeNumber: -1 },
    //         },
    //         { new: true }
    //       ),
    //       User.findByIdAndUpdate(req.id, { $pull: { likeReview: likeId } }),
    //     ]);

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
