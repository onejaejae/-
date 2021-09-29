import express from "express";
import { getShow } from "../controllers/showController";

const reviewRouter = express.Router();

// 권한 test용
reviewRouter.get("/", getShow);

export default reviewRouter;
