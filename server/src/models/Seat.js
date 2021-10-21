import mongoose from "mongoose";

export const seatSchema = new mongoose.Schema(
  {
    floor: {
      type: Number,
      required: true,
    },

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

    version: {
      type: Number,
      required: true,
    },
  },

  { timestamps: true }
);

const Seat = mongoose.model("Seat", seatSchema);

export default Seat;
