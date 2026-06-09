import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    fileName: {
      type: String,
      required: true,
    },

    chunks: [
      {
        text: {
          type: String,
          required: true,
        },

        embedding: {
          type: [Number],
          default: [],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Document",
  documentSchema
);
