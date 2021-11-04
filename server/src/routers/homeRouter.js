import express from "express";
import {
  postShow,
  getShow,
  getShowDetail,
  getSearchMusical,
  getSearchShow,
  getSearchTheater,
  postScrap,
  deleteUnScrap,
  getReviewList,
} from "../controllers/homeController";
import authJWT from "../middlewares/authJWT";
import homeRoutes from "../routes/home.routes";

const homeRouter = express.Router();

// 공연 리스트
homeRouter.get("/", getShow);
// 뮤지컬 검색
homeRouter.get(homeRoutes.musicalSearch, getSearchMusical);
// 연극 검색
homeRouter.get(homeRoutes.showSearch, getSearchShow);
// 극장 검색
homeRouter.get(homeRoutes.theaterSearch, getSearchTheater);
// 최신 or 좋아요순 리뷰 5개
homeRouter.get(homeRoutes.review, getReviewList);

// db 저장용
homeRouter.get("/post", postShow);

// 공연 상세 페이지
homeRouter.get("/:showId", getShowDetail);

homeRouter.post(`/:showId${homeRoutes.scrap}`, authJWT, postScrap);
homeRouter.delete(`/:showId${homeRoutes.unScrap}`, authJWT, deleteUnScrap);

export default homeRouter;
