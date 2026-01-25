import express from "express";
import {
  addComment,
  getCommentsForTask,
} from "../controllers/commentController.js";

const commentRouter = express.Router();
commentRouter.post("/", addComment); // Route to add a comment
commentRouter.get("/:taskId", getCommentsForTask); // Route to get comments for a specific task
export default commentRouter;
