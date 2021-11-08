import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    nickname: {
      type: String,
      required: false,
      unique: 1,
    },

    avatarUrl: {
      type: String,
      default: "902e5693-e0bb-4097-8ab5-b81a71003fe4.jpg",
    },

    likeReviews: [{ type: mongoose.Types.ObjectId }],
    scrapShows: [{ type: mongoose.Types.ObjectId }],
    writeReviews: [{ type: mongoose.Types.ObjectId }],
    reportReviews: [{ type: mongoose.Types.ObjectId }],
    blockUsers: [{ type: mongoose.Types.ObjectId, ref: "User" }],

    appleId: String,
    kakaoId: Number,
    facebookId: Number,
    googleId: Number,
    naverId: String,
  },

  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
