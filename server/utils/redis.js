import redis from "redis";
import dotenv from "dotenv";

dotenv.config();

const { NODE_ENV, REDIS_PORT_PRO } = process.env;

let redisClient;

if (NODE_ENV === "production") {
  redisClient = redis.createClient({
    host: "redis-server",
    port: REDIS_PORT_PRO,
  });
} else {
  redisClient = redis.createClient();
}

export default redisClient;
