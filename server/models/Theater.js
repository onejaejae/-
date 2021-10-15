import mongoose from "mongoose";

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
    review: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Review",
        default: [],
      },
    ],

    reviewCount: {
      type: Number,
      default: 0,
    },

    seatNumber: {
      type: Number,
    },
  },

  { timestamps: true }
);

const Theater = mongoose.model("Theater", theaterSchema);

export default Theater;
