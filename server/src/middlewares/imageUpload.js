import multer from "multer";
import multerS3 from "multer-s3";
import { s3 } from "../aws";

const { v4: uuid } = require("uuid");

const storage = multerS3({
  s3,
  bucket: "bogobogo",
  key: (req, file, cb) => {
    let mimeType;

    switch (file.mimetype) {
      case "image/jpeg":
        mimeType = "jpg";
        break;
      case "image/png":
        mimeType = "png";
        break;
      case "image/gif":
        mimeType = "gif";
        break;
      case "image/bmp":
        mimeType = "bmp";
        break;
      default:
        mimeType = "jpg";
        break;
    }

    cb(null, `raw/${uuid()}.${mimeType}`);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 5, //5MB
  },
});
