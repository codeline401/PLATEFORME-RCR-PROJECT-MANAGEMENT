import express from "express";
import {
  createProject,
  updateProject,
  addMemberToProject,
} from "../controllers/projectController.js";
import { protect } from "../middlewares/authMiddlewares.js";

const projectRouter = express.Router();

projectRouter.post("/", protect, createProject);
projectRouter.put("/:projectId", protect, updateProject);
projectRouter.post(
  "/:projectId/addMemberToProject",
  protect,
  addMemberToProject,
);

export default projectRouter;
