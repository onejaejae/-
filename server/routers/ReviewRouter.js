import express from "express";
// import reviewRoutes from "../routes/review.routes";
import {
  postReview,
  getReviewDetail,
  deleteReview,
  patchReview,
  patchLike,
  patchUnlike,
} from "../controllers/reviewController";
import authJWT from "../middlewares/authJWT";

const reviewRouter = express.Router();

reviewRouter.get("/:reviewId", authJWT, getReviewDetail);
reviewRouter.post("/", authJWT, postReview);
reviewRouter.patch("/:reviewId/like", authJWT, patchLike);
reviewRouter.patch("/:reviewId/unlike", authJWT, patchUnlike);
reviewRouter.patch("/:reviewId", authJWT, patchReview);
reviewRouter.delete("/:reviewId", authJWT, deleteReview);

export default reviewRouter;
