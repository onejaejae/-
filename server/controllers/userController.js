import jwt from "jsonwebtoken";
import redisClient from "../utils/redis";
import throwError from "../utils/throwError";
import User from "../models/User";
import { verify, sign, refresh, refreshVerify } from "../utils/jwt";

// const { KAKAO_CLIENT_ID, KAKAO_SECRET, KAKAO_REDIRECT_URL } = process.env;

export const getLogout = (req, res, next) => {
  try {
    if (!req.session.loggedIn) return next(throwError(400, "권한이 없습니다."));

    req.session.destroy();
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// refresh
export const getRefresh = (req, res, next) => {
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
      const refreshResult = refreshVerify(refreshToken, decoded.id);

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

          console.log(decoded);
          const newAccessToken = sign(decoded);

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

// kakao

export const kakaoLoginCallback = async (
  accessToken,
  refreshToken,
  profile,
  done
) => {
  try {
    const {
      _json: { id: kakaoId },
    } = profile;

    let user = await User.findOne({ kakaoId });
    const token = {};

    if (!user) {
      user = await User.create({
        kakaoId,
      });
    }

    const AccessToken = sign(user);
    const RefreshToken = refresh();

    token.accessToken = AccessToken;
    token.refreshToken = RefreshToken;

    redisClient.set(user.id, RefreshToken);

    done(null, token);
  } catch (error) {
    console.error("error", error);
    return done(error);
  }
};

export const postKakaoLogin = (req, res) => {
  res.status(200).json({ success: true, data: req.user });
};

export const editProfile = (req, res) => {
  res.send("권한 있다.");
};
