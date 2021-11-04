import express from "express";
import theaterRoutes from "../routes/theater.routes";
import authJWT from "../middlewares/authJWT";
import {
  getTheater,
  getTheaterDetail,
  getReview,
} from "../controllers/theaterController";

const theaterRouter = express.Router();

// 극장 리스트
theaterRouter.get("/", getTheater);
theaterRouter.get(theaterRoutes.review, getReview);
theaterRouter.get("/:theaterId", getTheaterDetail);

export default theaterRouter;
