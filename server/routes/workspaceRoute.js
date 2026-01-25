import express from "express";
import {
  getUserWorkspaces,
  addWorkspaceMember,
  inviteWorkspaceMember,
  checkUserInvitations,
} from "../controllers/workspaceController.js";
import { protect } from "../middlewares/authMiddlewares.js";

const workspaceRouter = express.Router();

workspaceRouter.get("/", protect, getUserWorkspaces);
workspaceRouter.post("/add-member", protect, addWorkspaceMember);
workspaceRouter.post("/:workspaceId/invite", protect, inviteWorkspaceMember);
workspaceRouter.get("/invitation/check", protect, checkUserInvitations);

export default workspaceRouter;
