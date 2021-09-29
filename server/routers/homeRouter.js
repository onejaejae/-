import express from "express";
import { postShow } from "../controllers/homeController";

const homeRouter = express.Router();

// 권한 test용
homeRouter.get("/", postShow);

export default homeRouter;
