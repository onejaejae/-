import mongoose from "mongoose";

export const seatSchema = new mongoose.Schema(
  {
    theaterName: {
      type: String,
      required: true,
    },
    position: {
      x: Number,
      y: Number,
    },
    index: {
      type: Number,
    },

    tags: [
      {
        type: String,
      },
    ],

    column: {
      type: String,
    },

    section: String,
  },

  { timestamps: true }
);

const Seat = mongoose.model("Seat", seatSchema);

export default Seat;
