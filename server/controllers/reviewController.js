import mongoose from "mongoose";
import Review from "../models/Review";
import Theater from "../models/Theater";
import User from "../models/User";
import Show from "../models/Show";
import throwError from "../utils/throwError";

export const getReviewDetail = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    if (!mongoose.isValidObjectId(reviewId)) {
      return next(throwError(400, "reviewId가 유효하지 않습니다."));
    }

    const review = await Review.findById(reviewId);
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

export const postReview = async (req, res, next) => {
  try {
    const { fcltynm, mt20id } = req.body;

    const user = await User.findById(req.id);
    req.body.writer = user;
    const newReview = new Review(req.body);

    const show = await Show.findOne({ mt20id });
    const result =
      (show.totalRating + req.body.rating) / (show.reviewNumber + 1);

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
        { $push: { postReview: { $each: [newReview.id], $slice: -10 } } }
      ),
      Show.updateOne(
        { mt20id },
        {
          $inc: { reviewNumber: 1 },
          rating: result.toFixed(1),
          totalRating: show.totalRating + req.body.rating,
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
    const [review, show] = await Promise.all([
      Review.findById(reviewId),
      Show.findOne({ mt20id }),
    ]);

    const totalRating = show.totalRating - review.rating;
    const rating = totalRating / (show.reviewNumber - 1);

    await Promise.all([
      Review.findByIdAndDelete(reviewId),
      User.updateOne({ _id: req.id }, { $pull: { postReview: reviewId } }),
      Theater.updateOne(
        { name: review.fcltynm },
        { $inc: { reviewCount: -1 }, $pull: { review: { _id: reviewId } } }
      ),
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

    const [updateReview] = await Promise.all([
      Review.findByIdAndUpdate(
        reviewId,
        {
          $inc: { likeNumber: 1 },
          $push: { likes: { userId: req.id, createAt: Date.now() } },
        },
        { new: true }
      ),
      User.findByIdAndUpdate(req.id, {
        $push: { likeReview: { $each: [reviewId], slice: -10 } },
      }),
    ]);

    res.status(200).json({ success: true, data: updateReview });
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

    const [updateReview] = await Promise.all([
      Review.findByIdAndUpdate(
        reviewId,
        {
          $inc: { likeNumber: -1 },
          $pull: { likes: { userId: req.id } },
        },
        { new: true }
      ),
      User.findByIdAndUpdate(req.id, { $pull: { likeReview: reviewId } }),
    ]);

    res.status(200).json({ success: true, data: updateReview });
  } catch (error) {
    next(error);
  }
};
