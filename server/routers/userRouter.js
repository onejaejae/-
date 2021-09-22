import express from "express";
import userRoutes from "../routes/users.routes";
import { editProfile, getRefresh, getJwt } from "../controllers/userController";
import authJWT from "../middlewares/authJWT";

const userRouter = express.Router();

// 권한 test용
userRouter.get("/profile", authJWT, editProfile);

// third party access token 인증, jwt 생성
userRouter.get(userRoutes.jwt, getJwt);

// access token 재발급
userRouter.get(userRoutes.refresh, getRefresh);

export default userRouter;
