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
      default: "ee3e6ef5-6359-40a0-9dbd-cc6a6bb91a78.jpeg",
    },

    likeReviews: [{ type: mongoose.Types.ObjectId }],
    scrapShows: [{ type: mongoose.Types.ObjectId }],

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
