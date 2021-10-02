import Review from "../models/Review";
import Theater from "../models/Theater";
import User from "../models/User";
import Show from "../models/Show";

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
      User.updateOne({ _id: req.id }, { $push: { postReview: newReview.id } }),
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
