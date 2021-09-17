import passport from "passport";
import express from "express";
import userRoutes from "../routes/users.routes";
import {
  getLogout,
  postKakaoLogin,
  editProfile,
  getRefresh,
  getJwt,
} from "../controllers/userController";
import authJWT from "../middlewares/authJWT";

const userRouter = express.Router();

const { NODE_ENV, CLIENT_HOME_URL_DEV, CLIENT_HOME_URL_PRO } = process.env;

// 권한 test용
userRouter.get("/profile", authJWT, editProfile);

// third party access token 인증, jwt 생성
userRouter.get(userRoutes.jwt, getJwt);

// kakao
userRouter.get(
  userRoutes.kakaoStart,
  passport.authenticate("kakao", { session: false })
);

userRouter.get(
  userRoutes.kakaoFinish,
  passport.authenticate("kakao", {
    session: false,
    failureRedirect:
      NODE_ENV === "dev" ? CLIENT_HOME_URL_DEV : CLIENT_HOME_URL_PRO,
  }),
  postKakaoLogin
);

// logout
userRouter.get(userRoutes.logout, getLogout);

// access token 재발급
userRouter.get(userRoutes.refresh, getRefresh);

export default userRouter;
