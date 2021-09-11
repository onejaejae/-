import redis from "redis";

const { NODE_ENV, REDIS_PORT_DEV, REDIS_PORT_PRO, REDIS_HOST } = process.env;

let redisClient;
if (NODE_ENV === "production") {
  redisClient = redis.createClient(REDIS_PORT_PRO, REDIS_HOST);
} else {
  redisClient = redis.createClient(REDIS_PORT_DEV);
}

export default redisClient;
