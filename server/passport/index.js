import passport from "passport";
import kakao from "passport-kakao";
import { kakaoLoginCallback } from "../controllers/userController";

passport.use(
  new kakao.Strategy(
    {
      clientID: process.env.KAKAO_CLIENT_ID,
      // clientSecret을 사용하지 않는다면 넘기지 말거나 빈 스트링을 넘길 것
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
      callbackURL:
        process.env.NODE_ENV === "production"
          ? process.env.KAKAO_CALLBACK_URL_PRO
          : process.env.KAKAO_CALLBACK_URL_DEV,
      authorizationURL: `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${
        process.env.KAKAO_CLIENT_ID
      }&redirect_uri=${
        process.env.NODE_ENV === "production"
          ? process.env.KAKAO_CALLBACK_URL_PRO
          : process.env.KAKAO_CALLBACK_URL_DEV
      }&prompt=login`,
    },
    kakaoLoginCallback
  )
);
