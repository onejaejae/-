import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    nickname: {
      type: String,
      unique: 1,
    },

    refreshToken: {
      type: String,
      required: true,
    },
  },

  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
