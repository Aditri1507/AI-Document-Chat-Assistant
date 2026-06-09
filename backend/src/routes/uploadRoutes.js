import express from "express";
import multer from "multer";
import { uploadDocument } from "../controllers/uploadController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

router.post(
  "/",
  authMiddleware,
  upload.single("file"),
  uploadDocument
);

export default router;
