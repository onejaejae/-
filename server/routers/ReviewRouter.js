import express from "express";
// import reviewRoutes from "../routes/review.routes";
import {
  postReview,
  getReviewDetail,
  deleteReview,
} from "../controllers/reviewController";
import authJWT from "../middlewares/authJWT";

const reviewRouter = express.Router();

reviewRouter.get("/:reviewId", getReviewDetail);
reviewRouter.post("/", authJWT, postReview);
reviewRouter.delete("/:reviewId", authJWT, deleteReview);

export default reviewRouter;
