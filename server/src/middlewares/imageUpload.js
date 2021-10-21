import multer from "multer";
import mime from "mime-types";
import multerS3 from "multer-s3";
import { s3 } from "../aws";

const { v4: uuid } = require("uuid");

const storage = multerS3({
  s3,
  bucket: "bogobogo",
  key: (req, file, cb) =>
    cb(null, `raw/${uuid()}.${mime.extension(file.mimetype)}`),
});

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (["image/png", "image/jpeg"].includes(file.mimetype)) cb(null, true);
    else cb(new Error("invalid file type"), false);
  },
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
});