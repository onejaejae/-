import mongoose from "mongoose";

export const reviewSchema = new mongoose.Schema(
  {
    writer: {
      _id: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true,
        ref: "User",
      },
      nickname: {
        type: String,
        required: true,
      },
    },

    // 극장 이름
    // 첫 리뷰화면 이후에 댓글들을 보여주기 위해 필요
    fcltynm: {
      type: String,
      required: true,
    },

    // 공연 id
    mt20id: {
      type: String,
      required: true,
    },

    // 뮤지컬 or 연극 제목
    prfnm: {
      type: String,
      required: true,
    },

    // 시야 리뷰
    sightContent: {
      type: String,
      required: true,
    },

    show: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Show",
    },

    // 공연 리뷰
    showContent: {
      type: String,
      required: true,
    },

    // 관람 날짜
    date: {
      type: Date,
      required: true,
    },

    // casting 정보
    casting: {
      type: Array,
      required: true,
    },

    // 좌석
    seat: {
      floor: Number,
      section: String,
      column: String,
      index: Number,
    },

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

    // 별점
    rating: {
      type: Number,
      required: true,
    },

    // 스포일러 여부
    isSpoiler: {
      type: Boolean,
      default: false,
    },

    // 리뷰 좋아요
    likes: [
      { userId: { type: mongoose.Types.ObjectId }, createAt: { type: Date } },
    ],

    // 재방문여부
    isRevist: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Review = mongoose.model("Review", reviewSchema);

export default Review;
