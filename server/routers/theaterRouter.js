import express from "express";
import theaterRoutes from "../routes/theater.routes";
import { getTheater } from "../controllers/theaterController";

const theaterRouter = express.Router();

// 극장 리스트
theaterRouter.get("/", getTheater);

export default theaterRouter;
