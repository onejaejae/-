import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import responseTime from "response-time";
import userRoutes from "./routes/users.routes";
import userRouter from "./routers/userRouter";
import logger from "./config/logger";

dotenv.config();

const createServer = () => {
  const app = express();

  const { PORT } = process.env;

  app.set("port", PORT || 4000);
  app.use(responseTime());
  app.use(morgan("dev"));
  app.use(express.json());

  // 라우팅
  app.use(userRoutes.user, userRouter);

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    // console.error(err.message);
    res.status(err.status || 500);
    logger.error(
      `${res.req.method} ${res.req.url} ${err.status} Response: "success: false, msg: ${err.message}"`
    );
    res.json({ success: false, message: err.message });
  });

  app.use((req, res) => {
    res
      .status(404)
      .json({ success: false, message: "존재하지 않는 API입니다." });
  });

  return app;
};

export default createServer;
