import express from "express";
import {
  postShow,
  getShow,
  getShowDetail,
  getSearchShow,
} from "../controllers/homeController";
import homeRoutes from "../routes/home.routes";

const homeRouter = express.Router();

// db 저장용
homeRouter.get("/post", postShow);

// 공연 리스트
homeRouter.get("/", getShow);

// 공연 검색
homeRouter.get(homeRoutes.show, getSearchShow);

// 공연 상세 페이지
homeRouter.get("/:showId", getShowDetail);

export default homeRouter;
