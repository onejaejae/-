import dotenv from "dotenv";
import passport from "passport";
import { kakaoLoginCallback } from "../controllers/userController";

const KakaoStrategy = require("passport-kakao").Strategy;

dotenv.config();

const {
  KAKAO_CLIENT_ID,
  KAKAO_CLIENT_SECRET,
  NODE_ENV,
  KAKAO_CALLBACK_URL_PRO,
  KAKAO_CALLBACK_URL_DEV,
} = process.env;

passport.use(
  new KakaoStrategy(
    {
      clientID: KAKAO_CLIENT_ID,
      clientSecret: KAKAO_CLIENT_SECRET,
      callbackURL:
        NODE_ENV === "production"
          ? KAKAO_CALLBACK_URL_PRO
          : KAKAO_CALLBACK_URL_DEV,
    },
    kakaoLoginCallback
  )
);
