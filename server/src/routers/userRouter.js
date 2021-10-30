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
  patchProfile,
  getSeatList,
  getSeatNum,
  getPrivacy,
  getPolicy,
  getNotice,
} from "../controllers/userController";
import authJWT from "../middlewares/authJWT";
import { upload } from "../middlewares/imageUpload";

const userRouter = express.Router();

userRouter.get("/num", getSeatNum);

// third party access token 인증, jwt 생성
userRouter.get(userRoutes.jwt, getJwt);
// access token 재발급
userRouter.get(userRoutes.refresh, getRefresh);

userRouter.get(userRoutes.seat, getSeat);
userRouter.get(`${userRoutes.seat}/list`, getSeatList);

userRouter.get(userRoutes.logout, authJWT, getLogout);

userRouter.get(userRoutes.activity, authJWT, getActivity);

userRouter.get(userRoutes.profile, authJWT, getProfile);

userRouter.get(userRoutes.privacy, getPrivacy);

userRouter.get(userRoutes.policy, getPolicy);

userRouter.get(userRoutes.notice, getNotice);

userRouter.patch(
  userRoutes.profile,
  authJWT,
  upload.single("image"),
  patchProfile
);

userRouter.delete("/", authJWT, deleteUser);

// DB data 축적용
userRouter.post("/postSeat", postSeat);
userRouter.patch("/seat", updateSeat);

export default userRouter;
