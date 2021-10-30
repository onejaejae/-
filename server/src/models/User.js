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
      default: "b98710b2-2216-4f88-bde0-05f0792dfd4f.jpeg",
    },

    likeReviews: [{ type: mongoose.Types.ObjectId }],
    scrapShows: [{ type: mongoose.Types.ObjectId }],
    writeReviews: [{ type: mongoose.Types.ObjectId }],

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
