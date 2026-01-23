import express from "express";
import {
  addComment,
  getCommentsForTask,
} from "../controllers/commentController.js";
import { protect } from "../middlewares/authMiddlewares.js";

const commentRouter = express.Router();
commentRouter.post("/", protect, addComment); // Route to add a comment
commentRouter.get("/:taskId", protect, getCommentsForTask); // Route to get comments for a specific task
export default commentRouter;
