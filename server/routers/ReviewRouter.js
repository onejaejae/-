import express from "express";
// import reviewRoutes from "../routes/review.routes";
import { postReview } from "../controllers/reviewController";
import authJWT from "../middlewares/authJWT";

const reviewRouter = express.Router();

// 권한 test용
reviewRouter.post("/", authJWT, postReview);

export default reviewRouter;
