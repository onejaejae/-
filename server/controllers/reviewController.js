import Review from "../models/Review";
import Theater from "../models/Theater";
import User from "../models/User";

export const postReview = async (req, res, next) => {
  try {
    const { theaterId } = req.body;

    const [user] = await Promise.all([
      User.findById(req.id),
      Theater.findById(theaterId),
    ]);

    req.body.writer = user;
    const newReview = new Review(req.body);

    const [review] = await Promise.all([
      newReview.save(),
      Theater.updateOne(
        { _id: theaterId },
        {
          $inc: { reviewCount: 1 },
          $push: { review: { $each: [newReview] }, $slice: -10 },
        }
      ),
      User.updateOne({ _id: req.id }, { $push: { postReview: newReview.id } }),
    ]);

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};
