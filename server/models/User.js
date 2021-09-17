import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // nickname: {
    //   type: String,
    //   required: false,
    //   unique: 1,
    // },

    // refreshToken: {
    //   type: String,
    //   required: true,
    // },

    kakaoId: Number,
    facebookId: Number,
    googleId: Number,
    naverId: String,
  },

  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
