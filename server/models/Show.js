import mongoose from "mongoose";

const showSchema = new mongoose.Schema(
  {
    showId: String,
  },

  { timestamps: true }
);

const Show = mongoose.model("Show", showSchema);

export default Show;
