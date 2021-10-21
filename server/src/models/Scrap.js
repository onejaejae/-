import mongoose from "mongoose";

const scrapSchema = new mongoose.Schema(
  {
    // 좋아요한 유저
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
    },
    // 어떤 리뷰를 좋아요 했는지
    showId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Show",
    },
  },
  { timestamps: true }
);

const Scrap = mongoose.model("Scrap", scrapSchema);

export default Scrap;
