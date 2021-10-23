import winston from "winston";
import moment from "moment";
import "moment-timezone";

const { createLogger, transports, format } = winston;
const { combine, printf, label, colorize, simple } = format;

moment.tz.setDefault("Asia/Seoul");
const timeStamp = () => moment().format("YYYY-MM-DD HH:mm:ss");

const printLogFormat = {
  file: combine(
    label({
      label: "보고보고",
    }),
    printf(({ label, level, message }) => {
      return `${timeStamp()} ${label} ${level}: ${message}`;
    })
  ),
  console: combine(colorize(), simple()),
};

const opt = {
  file: new transports.File({
    filename: "access.log",
    dirname: "./logs",
    level: "info",
    format: printLogFormat.file,
  }),
  console: new transports.Console({
    level: "info",
    format: printLogFormat.console,
  }),
};

const logger = createLogger({
  transports: [opt.file],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(opt.console);
}

logger.stream = {
  write: (message) => logger.info(message),
};

export default logger;
