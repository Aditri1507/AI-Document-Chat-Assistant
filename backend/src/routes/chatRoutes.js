import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  askQuestion,
  getChatHistory,
  getChatById,
} from "../controllers/chatController.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  askQuestion
);

router.get(
  "/history",
  authMiddleware,
  getChatHistory
);
router.get(
  "/:id",            
  authMiddleware,
  getChatById
);

export default router;
