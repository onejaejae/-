import jwt from "jsonwebtoken";
import faker from "faker";
import redisClient from "../utils/redis";
import throwError from "../utils/throwError";
import tokenApi from "../utils/tokenApi";
import User from "../models/User";
import Seat from "../models/Seat";
import Theater from "../models/Theater";
import userExist from "../utils/userExist";
import { verify, sign, refresh, refreshVerify } from "../utils/jwt";
import logger from "../config/logger";
import Review from "../models/Review";
import Show from "../models/Show";
import { s3 } from "../aws";

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

    const AccessToken = req.headers.authorization.split("Bearer ")[1];
    const userObj = {};
    let Tokendata;
    let userData;
    let user;

    switch (provider) {
      case "kakao":
        Tokendata = await tokenApi(
          "https://kapi.kakao.com/v1/user/access_token_info",
          AccessToken
        );
        break;

      case "naver":
        Tokendata = await tokenApi(
          "https://openapi.naver.com/v1/nid/verify",
          AccessToken
        );
        break;

      case "google":
        try {
          Tokendata = await tokenApi(
            `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${AccessToken}`
          );
        } catch (error) {
          next(error);
        }
        break;

      case "facebook":
        try {
          Tokendata = await tokenApi(
            `https://graph.facebook.com/debug_token?
            input_token=${AccessToken}
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
      return next(throwError(400, "토큰이 유효하지 않습니다."));
    }

    switch (provider) {
      case "kakao":
        userData = await (
          await tokenApi("https://kapi.kakao.com/v2/user/me", AccessToken)
        ).json();

        userObj.kakaoId = userData.id;
        user = await userExist(userObj);

        if (!user) {
          user = await User.create({
            nickname:
              faker.internet.userName() + parseInt(Math.random() * 100000),
            kakaoId: userData.id,
          });
        }
        break;

      case "naver":
        userData = await (
          await tokenApi("https://openapi.naver.com/v1/nid/me", AccessToken)
        ).json();

        userObj.naverId = userData.response.id;
        user = await userExist(userObj);

        if (!user) {
          user = await User.create({
            nickname:
              faker.internet.userName() + parseInt(Math.random() * 100000),
            naverId: userData.response.id,
          });
        }
        break;

      case "google":
        try {
          userData = await (
            await tokenApi(
              `https://www.googleapis.com/oauth2/v2/userinfo`,
              AccessToken
            )
          ).json();

          userObj.googleId = userData.id;
          user = await userExist(userObj);

          if (!user) {
            user = await User.create({
              nickname:
                faker.internet.userName() + parseInt(Math.random() * 100000),
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
              `https://graph.facebook.com/me?access_token=${AccessToken}`
            )
          ).json();

          userObj.facebookId = userData.id;
          user = await userExist(userObj);

          if (!user) {
            user = await User.create({
              nickname:
                faker.internet.userName() + parseInt(Math.random() * 100000),
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
    const accessToken = sign(user);
    const refreshToken = refresh();

    redisClient.set(user.id, refreshToken);

    logger.info(`GET /jwt 200 Response: "success: true"`);

    res
      .status(200)
      .json({ success: true, data: { accessToken, refreshToken } });
  } catch (error) {
    next(error);
  }
};

export const getLogout = async (req, res, next) => {
  try {
    redisClient.del(req.id);
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const getActivity = async (req, res, next) => {
  try {
    const { type } = req.query;
    if (!type) {
      return next(throwError(400, "query type이 없습니다."));
    }

    let data;
    switch (type) {
      case "write":
        data = await User.findById(req.id, {
          postReview: 1,
        }).populate({
          path: "postReview",
          populate: { path: "show" },
        });
        data = data.postReview.sort((a, b) => {
          return b.createdAt - a.createdAt;
        });
        break;
      case "like":
        data = await User.findById(req.id, { likeReview: 1 }).populate({
          path: "likeReview",
          populate: { path: "show" },
        });
        data = data.likeReview.sort((a, b) => {
          return (
            b.likes[b.likes.length - 1].createAt -
            a.likes[a.likes.length - 1].createAt
          );
        });
        break;

      case "scrap":
        data = await User.findById(req.id, { scrapShow: 1 }).populate(
          "scrapShow"
        );
        console.log(data);
        data = data.scrapShow.sort((a, b) => {
          return (
            b.scraps[b.scraps.length - 1].createAt -
            a.scraps[a.scraps.length - 1].createAt
          );
        });
        console.log(data);
        break;

      default:
        return next(
          throwError(400, "type key값의 value 값이 올바르지 않습니다.")
        );
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getActivityList = async (req, res, next) => {
  try {
    const { page = 0, type } = req.query;
    if (!type) {
      return next(throwError(400, "query에 type이 없습니다."));
    }

    let data;
    switch (type) {
      case "write":
        data = await Review.find({ "writer._id": req.id }, { likes: 0 })
          .sort({ createdAt: -1 })
          .skip(page * 10)
          .limit(10);
        break;
      case "like":
        data = await Review.find({ "likes.userId": req.id }, { likes: 0 })
          .sort({ "scraps.createdAt": -1 })
          .skip(page * 10)
          .limit(10);
        break;

      case "scrap":
        data = await Show.find({ "scraps.userId": req.id }, { scraps: 0 })
          .sort({ "scraps.createdAt": -1 })
          .skip(page * 10)
          .limit(10);
        break;

      default:
        return next(
          throwError(400, "type key값의 value 값이 올바르지 않습니다.")
        );
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.id, { nickname: 1, avatarUrl: 1 });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// post seat
export const postSeat = async (req, res, next) => {
  try {
    const { name, location, floor } = req.body;

    // await Theater.create({
    //   name,
    //   location,
    // });

    const result = [];

    req.body.data.forEach((data) => {
      data.forEach(async (data2) => {
        delete data2.color;
        data2.theaterName = name;
        data2.version = 1.0;
        data2.floor = floor;

        if (!data2.index) {
          const seat = new Seat(data2);
          result.push(seat);
        }
      });
    });

    // await Seat.insertMany(result);
    console.log("finished!!");
    console.log(result);
    console.log(result.length);

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const updateSeat = async (req, res, next) => {
  try {
    // const { fcltynm } = req.query;

    // await Show.deleteMany({ fcltynm });
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// export const postSeat = async (req, res, next) => {
//   try {
//     const obj = {
//       floor: "1층",
//     };

//     req.body.data.forEach((data) => {
//       data.forEach(async (data2) => {
//         delete data2.color;
//         console.log(data2);

//         const col = data2.column;
//         obj[`${col}`] = [];
//         // seat.index.push(data2.index);
//       });
//     });

//     req.body.data.forEach((data) => {
//       data.forEach(async (data2) => {
//         delete data2.color;

//         const col = data2.column;
//         obj[`${col}`].push(data2.index);
//         // seat.index.push(data2.index);
//       });
//     });

//     res.status(200).json({ success: true, obj });
//   } catch (error) {
//     next(error);
//   }
// };

export const getSeat = async (req, res, next) => {
  try {
    const { theaterName } = req.query;

    const seat = await Seat.find({ theaterName }).sort({
      createdAt: 1,
    });

    const obj = {};

    seat.forEach((data) => {
      obj[`${data.floor}`] = {};
    });

    seat.forEach((data) => {
      const x = obj[`${data.floor}`];
      x[`${data.section ? data.section : data.column}`] = {};
    });

    seat.forEach((data) => {
      const x = obj[`${data.floor}`];
      const y = x[`${data.section ? data.section : data.column}`];

      if (
        (data.tags[0] === "휠체어석" && !data.column) ||
        (data.tags[0] === "시야제한석" && !data.column)
      ) {
        console.log("next");
      } else if (!data.section) {
        x[`${data.column}`] = [];
      } else if (!data.column) {
        x[`${data.section}`] = [];
      } else {
        y[`${data.column}`] = [];
      }
    });

    seat.forEach((data) => {
      const x = obj[`${data.floor}`];
      const y = x[`${data.section ? data.section : data.column}`];

      if (
        (data.tags[0] === "휠체어석" && data.section) ||
        (data.tags[0] === "시야제한석" && !data.column)
      ) {
        console.log("next");
      } else if (data.tags[0] === "휠체어석" && !data.column) {
        delete x[`${data.section ? data.section : data.column}`];
      } else if (!data.section) {
        x[`${data.column}`].push(data.index);
      } else if (!data.column) {
        x[`${data.section}`].push(data.index);
      } else {
        y[`${data.column}`].push(data.index);
      }
    });

    return res.status(200).json({ success: true, data: obj });
  } catch (error) {
    next(error);
  }
};

export const getSeatList = async (req, res, next) => {
  try {
    const { theaterName, floor } = req.query;

    const seat = await Seat.find({ theaterName, floor });

    return res.status(200).json({ success: true, data: seat });
  } catch (error) {
    next(error);
  }
};

export const patchProfile = async (req, res, next) => {
  try {
    const { file } = req;
    let updateUser;
    const variable = req.body;

    if (!file) {
      const user = await User.findById(req.id);
      if (user.avatarUrl) {
        s3.deleteObject(
          { Bucket: "bogobogo", Key: `raw/${user.avatarUrl}` },
          (error) => {
            if (error) throw error;
          }
        );
        s3.deleteObject(
          { Bucket: "bogobogo", Key: `w140/${user.avatarUrl}` },
          (error) => {
            if (error) throw error;
          }
        );
        s3.deleteObject(
          { Bucket: "bogobogo", Key: `w600/${user.avatarUrl}` },
          (error) => {
            if (error) throw error;
          }
        );
        variable.avatarUrl = "";
      }

      updateUser = await User.findByIdAndUpdate(req.id, variable, {
        new: true,
      });
    } else {
      // eslint-disable-next-line prefer-destructuring
      variable.avatarUrl = file.key.split("/")[1];
      updateUser = await User.findByIdAndUpdate(req.id, variable, {
        new: true,
      });
    }

    res.status(200).json({ success: true, data: updateUser });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const [user] = await Promise.all([
      User.findById(req.id),
      User.findByIdAndDelete(req.id),
      Review.updateMany(
        { "writer._id": req.id },
        { writer: { nickname: "탈퇴 회원" } }
      ),
      Theater.updateMany(
        {},
        { "review.$[element].writer.nickname": "탈퇴 회원" },
        { arrayFilters: [{ "element.writer._id": req.id }] }
      ),
      Show.updateMany({}, { $pull: { scraps: { userId: req.id } } }),
      Review.updateMany(
        {},
        { $pull: { likes: { userId: req.id } }, $inc: { likeNumber: -1 } }
      ),
    ]);

    if (user.avatarUrl) {
      s3.deleteObject(
        { Bucket: "bogobogo", Key: `raw/${user.avatarUrl}` },
        (error) => {
          if (error) throw error;
        }
      );
      s3.deleteObject(
        { Bucket: "bogobogo", Key: `w140/${user.avatarUrl}` },
        (error) => {
          if (error) throw error;
        }
      );
      s3.deleteObject(
        { Bucket: "bogobogo", Key: `w600/${user.avatarUrl}` },
        (error) => {
          if (error) throw error;
        }
      );
    }

    redisClient.del(req.id);
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
