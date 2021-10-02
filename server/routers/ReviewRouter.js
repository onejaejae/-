import express from "express";
// import reviewRoutes from "../routes/review.routes";
import { postReview, getReview } from "../controllers/reviewController";
import authJWT from "../middlewares/authJWT";

const reviewRouter = express.Router();

reviewRouter.get("/", authJWT, getReview);
reviewRouter.post("/", authJWT, postReview);

export default reviewRouter;
