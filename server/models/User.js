import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    nickname: {
      type: String,
      required: false,
      unique: 1,
    },

    // 좋아요 한 리뷰들
    likeReview: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "Review",
      },
    ],

    // 작성 한 리뷰들
    postReview: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "Review",
      },
    ],

    // 눈 여겨본 공연들
    scrapShow: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "Show",
      },
    ],

    avatarUrl: String,
    // avatarUrl key
    key: String,

    kakaoId: Number,
    facebookId: Number,
    googleId: Number,
    naverId: String,
  },

  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
