import express from "express";
import userRoutes from "../routes/users.routes";
import {
  getLogout,
  startKakaoLogin,
  finishKakaoLogin,
} from "../controllers/userController";

const userRouter = express.Router();

// kakao
userRouter.get(userRoutes.kakaoStart, startKakaoLogin);
userRouter.get(userRoutes.kakaoFinish, finishKakaoLogin);

// logout
userRouter.get(userRoutes.logout, getLogout);

export default userRouter;
