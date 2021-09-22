import jwt from "jsonwebtoken";
import redisClient from "../utils/redis";
import throwError from "../utils/throwError";
import tokenApi from "../utils/tokenApi";
import User from "../models/User";
import userExist from "../utils/userExist";
import { verify, sign, refresh, refreshVerify } from "../utils/jwt";
import logger from "../config/logger";

const { FACEBOOK_ID } = process.env;

// refresh
export const getRefresh = async (req, res, next) => {
  try {
    // access token과 refresh token의 존재 유무를 체크합니다.
    if (req.headers.authorization && req.headers.refresh) {
      const accessToken = req.headers.authorization.split("Bearer ")[1];
      const refreshToken = req.headers.refresh;

      // access token 검증 -> expired여야 함.
      const accessResult = verify(accessToken);

      // access token 디코딩하여 user의 정보를 가져옵니다.
      const decoded = jwt.decode(accessToken);

      // 디코딩 결과가 없으면 권한이 없음을 응답.
      if (decoded === null) {
        return next(throwError(401, "권한이 없습니다."));
      }

      /* access token의 decoding 된 값에서
      유저의 id를 가져와 refresh token을 검증합니다. */
      const refreshResult = await refreshVerify(refreshToken, decoded.id);

      // 재발급을 위해서는 access token이 만료되어 있어야합니다.
      if (
        accessResult.success === false &&
        accessResult.message === "jwt expired"
      ) {
        // 1. access token이 만료되고, refresh token도 만료 된 경우 => 새로 로그인해야합니다.
        if (!refreshResult) {
          return next(throwError(401, "새로 로그인 해주세요."));
        } else {
          // 2. access token이 만료되고, refresh token은 만료되지 않은 경우 => 새로운 access token을 발급
          const newAccessToken = sign(decoded);

          logger.info(`GET /refresh 200 Response: "success: true"`);

          res.status(200).json({
            // 새로 발급한 access token과 원래 있던 refresh token 모두 클라이언트에게 반환합니다.
            success: true,
            data: {
              accessToken: newAccessToken,
              refreshToken,
            },
          });
        }
      } else {
        // 3. access token이 만료되지 않은경우 => refresh 할 필요가 없습니다.
        return next(throwError(400, "Access Token이 유효합니다."));
      }
    } else {
      // access token 또는 refresh token이 헤더에 없는 경우
      return next(throwError(400, "Access token, refresh token이 필요합니다."));
    }
  } catch (error) {
    next(error);
  }
};

// jwt
export const getJwt = async (req, res, next) => {
  try {
    const { provider } = req.query;

    if (!req.headers.authorization) {
      return next(throwError(400, "header에 accessToken이 없습니다."));
    }

    const accessToken = req.headers.authorization.split("Bearer ")[1];
    const userObj = {};
    let Tokendata;
    let userData;
    let user;

    switch (provider) {
      case "kakao":
        Tokendata = await tokenApi(
          "https://kapi.kakao.com/v1/user/access_token_info",
          accessToken
        );
        break;

      case "naver":
        Tokendata = await tokenApi(
          "https://openapi.naver.com/v1/nid/verify",
          accessToken
        );
        break;

      case "google":
        try {
          Tokendata = await tokenApi(
            `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
          );
        } catch (error) {
          next(error);
        }
        break;

      case "facebook":
        try {
          Tokendata = await tokenApi(
            `https://graph.facebook.com/debug_token?
            input_token=${accessToken}
            &access_token=${FACEBOOK_ID}`
          );
        } catch (error) {
          next(error);
        }
        break;

      default:
        return next(throwError(400, "잘못된 provider입니다."));
    }

    if (Tokendata.status !== 200) {
      next(throwError(400, "토큰이 유효하지 않습니다."));
    }

    switch (provider) {
      case "kakao":
        userData = await (
          await tokenApi("https://kapi.kakao.com/v2/user/me", accessToken)
        ).json();

        userObj.kakaoId = userData.id;
        user = await userExist(userObj);

        if (!user) {
          user = await User.create({
            kakaoId: userData.id,
          });
        }
        break;

      case "naver":
        userData = await (
          await tokenApi("https://openapi.naver.com/v1/nid/me", accessToken)
        ).json();

        userObj.naverId = userData.response.id;
        user = await userExist(userObj);

        if (!user) {
          user = await User.create({
            naverId: userData.response.id,
          });
        }
        break;

      case "google":
        try {
          userData = await (
            await tokenApi(
              `https://www.googleapis.com/oauth2/v2/userinfo`,
              accessToken
            )
          ).json();

          userObj.googleId = userData.id;
          user = await userExist(userObj);

          if (!user) {
            user = await User.create({
              googleId: userData.id,
            });
          }
        } catch (error) {
          next(error);
        }
        break;

      case "facebook":
        try {
          userData = await (
            await tokenApi(
              `https://graph.facebook.com/me?access_token=${accessToken}`
            )
          ).json();

          userObj.facebookId = userData.id;
          user = await userExist(userObj);

          if (!user) {
            user = await User.create({
              facebookId: userData.id,
            });
          }
        } catch (error) {
          next(error);
        }
        break;

      default:
        return next(throwError(400, "잘못된 provider입니다."));
    }

    // jwt 발급
    const AccessToken = sign(user);
    const RefreshToken = refresh();

    redisClient.set(user.id, RefreshToken);

    logger.info(`GET /jwt 200 Response: "success: true"`);

    res
      .status(200)
      .json({ success: true, data: { AccessToken, RefreshToken } });
  } catch (error) {
    next(error);
  }
};

// test용
export const editProfile = (req, res) => {
  console.log(req.id);
  res.send("권한 있다.");
};
