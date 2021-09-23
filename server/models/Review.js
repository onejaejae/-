import mongoose from "mongoose";
import { seatSchema } from "./Seat";

export const reviewSchema = new mongoose.Schema(
  {
    writer: {
      _id: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true,
        ref: "User",
      },
      //   nickname: {
      //     type: String,
      //     required: true,
      //   },
    },

    // 어떤 극장의 리뷰인지
    theaterId: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
      ref: "blog",
    },

    // 댓글 내용
    content: {
      type: String,
      required: true,
    },

    // 해당 좌석
    seat: seatSchema,

    // 좋아요 수
    likeNumber: {
      type: Number,
      default: 0,
    },

    // 작성 시간
    createAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Review = mongoose.model("Review", reviewSchema);

export default Review;
