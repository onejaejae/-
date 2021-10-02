import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import redisClient from "./redis";

dotenv.config();
const { promisify } = require("util");

const { JWT_SECRET } = process.env;

export const sign = (user) => {
  const payload = {
    // access token에 들어갈 payload
    id: user.id,
  };

  return jwt.sign(payload, JWT_SECRET, {
    // secret으로 sign하여 발급하고 return
    algorithm: "HS256", // 암호화 알고리즘
    expiresIn: "30m", // 유효기간
  });
};

export const verify = (token) => {
  let decoded = null;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
    return {
      success: true,
      id: decoded.id,
    };
  } catch (err) {
    return {
      success: false,
      message: err.message,
    };
  }
};

export const refresh = () => {
  return jwt.sign({}, JWT_SECRET, {
    // refresh token은 payload 없이 발급
    algorithm: "HS256",
    expiresIn: "100000000000000000000000000000000000000m",
  });
};

export const refreshVerify = async (token, userId) => {
  // refresh token 검증
  /* redis 모듈은 기본적으로 promise를 반환하지 않으므로,
       promisify를 이용하여 promise를 반환하게 해줍니다.*/
  const getAsync = promisify(redisClient.get).bind(redisClient);

  try {
    const data = await getAsync(userId); // refresh token 가져오기
    if (token === data) {
      try {
        jwt.verify(token, JWT_SECRET);
        return true;
      } catch (err) {
        return false;
      }
    } else {
      return false;
    }
  } catch (err) {
    return false;
  }
};
