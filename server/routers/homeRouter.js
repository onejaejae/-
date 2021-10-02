import express from "express";
import {
  postShow,
  getShow,
  getShowDetail,
  getSearchMusical,
  getSearchShow,
  getSearchTheater,
} from "../controllers/homeController";
import homeRoutes from "../routes/home.routes";

const homeRouter = express.Router();

// db 저장용
homeRouter.get("/post", postShow);

// 공연 리스트
homeRouter.get("/", getShow);

// 뮤지컬 검색
homeRouter.get(homeRoutes.musicalSearch, getSearchMusical);
// 연극 검색
homeRouter.get(homeRoutes.showSearch, getSearchShow);
// 극장 검색
homeRouter.get(homeRoutes.theaterSearch, getSearchTheater);

// 공연 상세 페이지
homeRouter.get("/:showId", getShowDetail);

export default homeRouter;
