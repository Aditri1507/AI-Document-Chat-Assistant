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

    // SHA256 hash of uploaded file
    fileHash: {
      type: String,
      required: false,
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

// Optional but recommended for faster lookups
documentSchema.index({
  user: 1,
  fileHash: 1,
});

export default mongoose.model(
  "Document",
  documentSchema
);
