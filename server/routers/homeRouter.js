import express from "express";
import {
  postShow,
  getShow,
  getShowDetail,
} from "../controllers/homeController";

const homeRouter = express.Router();

homeRouter.get("/post", postShow);
homeRouter.get("/", getShow);
homeRouter.get("/:mt20id", getShowDetail);

export default homeRouter;
