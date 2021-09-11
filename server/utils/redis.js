import redis from "redis";
import dotenv from "dotenv";

dotenv.config();

const { NODE_ENV, REDIS_PORT_PRO, REDIS_HOST } = process.env;

let redisClient;

if (NODE_ENV === "production") {
  redisClient = redis.createClient(REDIS_PORT_PRO, REDIS_HOST);
} else {
  redisClient = redis.createClient();
}

export default redisClient;
