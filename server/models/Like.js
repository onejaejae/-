import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    // 좋아요한 유저
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
    },
    // 어떤 리뷰를 좋아요 했는지
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
    },
  },
  { timestamps: true }
);

const Like = mongoose.model("Like", likeSchema);
export default Like;
