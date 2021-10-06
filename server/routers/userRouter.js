import express from "express";
import userRoutes from "../routes/users.routes";
import {
  getRefresh,
  getJwt,
  postSeat,
  getSeat,
  updateSeat,
  getLogout,
  deleteUser,
  getActivity,
  getProfile,
} from "../controllers/userController";
import authJWT from "../middlewares/authJWT";

const userRouter = express.Router();

// third party access token 인증, jwt 생성
userRouter.get(userRoutes.jwt, getJwt);
// access token 재발급
userRouter.get(userRoutes.refresh, getRefresh);

userRouter.get(userRoutes.seat, getSeat);

userRouter.get(userRoutes.logout, authJWT, getLogout);

userRouter.get(userRoutes.activity, authJWT, getActivity);

userRouter.get(userRoutes.profile, authJWT, getProfile);

userRouter.delete("/", authJWT, deleteUser);

// DB data 축적용
userRouter.post("/postSeat", postSeat);
userRouter.patch("/seat", updateSeat);

export default userRouter;
