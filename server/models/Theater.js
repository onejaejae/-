import mongoose from "mongoose";
import { reviewSchema } from "./Review";

const theaterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    review: [reviewSchema],

    reviewCount: {
      type: Number,
      default: 0,
    },
  },

  { timestamps: true }
);

const Theater = mongoose.model("Theater", theaterSchema);

export default Theater;
