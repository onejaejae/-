import express from "express";
import { postShow, getShow } from "../controllers/homeController";

const homeRouter = express.Router();

homeRouter.get("/post", postShow);
homeRouter.get("/", getShow);

export default homeRouter;
