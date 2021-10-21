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
theaterRouter.get("/", authJWT, getTheater);
theaterRouter.get(theaterRoutes.review, authJWT, getReview);
theaterRouter.get("/:theaterId", authJWT, getTheaterDetail);

export default theaterRouter;
