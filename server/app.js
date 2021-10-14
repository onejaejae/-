import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import "./db";
import responseTime from "response-time";
import userRoutes from "./routes/users.routes";
import reviewRoutes from "./routes/review.routes";
import homeRoutes from "./routes/home.routes";
import theaterRoutes from "./routes/theater.routes";
import userRouter from "./routers/userRouter";
import homeRouter from "./routers/homeRouter";
import theaterRouter from "./routers/theaterRouter";
import logger from "./config/logger";
import reviewRouter from "./routers/ReviewRouter";

dotenv.config();

const app = express();

const { PORT } = process.env;
app.use(responseTime());
app.use(morgan("dev"));

// request entity too large 해결 위해
app.use(
  express.json({
    limit: "50mb",
  })
);

// 라우팅
app.use(userRoutes.user, userRouter);
app.use(reviewRoutes.review, reviewRouter);
app.use(homeRoutes.home, homeRouter);
app.use(theaterRoutes.theater, theaterRouter);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.message);
  logger.error(
    `${res.req.method} ${res.req.url} ${err.status} Response: "success: false, msg: ${err.message}"`
  );
  res.status(err.status || 500);
  res.json({ success: false, message: err.message });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "존재하지 않는 API입니다." });
});

if (!PORT) console.error("PORT is required");

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
