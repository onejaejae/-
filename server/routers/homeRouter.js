import express from "express";
import {
  postShow,
  getShow,
  getShowDetail,
  getSearchMusical,
  getSearchShow,
  getSearchTheater,
  patchScrap,
  patchUnScrap,
} from "../controllers/homeController";
import authJWT from "../middlewares/authJWT";
import homeRoutes from "../routes/home.routes";

const homeRouter = express.Router();

// 공연 리스트
homeRouter.get("/", authJWT, getShow);
// 뮤지컬 검색
homeRouter.get(homeRoutes.musicalSearch, authJWT, getSearchMusical);
// 연극 검색
homeRouter.get(homeRoutes.showSearch, authJWT, getSearchShow);
// 극장 검색
homeRouter.get(homeRoutes.theaterSearch, authJWT, getSearchTheater);
// 공연 상세 페이지
homeRouter.get("/:showId", authJWT, getShowDetail);

homeRouter.patch(`/:showId${homeRoutes.scrap}`, authJWT, patchScrap);
homeRouter.patch(`/:showId${homeRoutes.unScrap}`, authJWT, patchUnScrap);

// db 저장용
homeRouter.get("/post", postShow);

export default homeRouter;
