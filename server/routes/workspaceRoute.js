import express from "express";
import {
  getUserWorkspaces,
  addWorkspaceMember,
  inviteWorkspaceMember,
} from "../controllers/workspaceController.js";

const workspaceRouter = express.Router();

workspaceRouter.get("/", getUserWorkspaces);
workspaceRouter.post("/add-member", addWorkspaceMember);
// FIX: Ajouter la route pour inviter un membre au workspace
workspaceRouter.post("/:workspaceId/invite", inviteWorkspaceMember);

export default workspaceRouter;

// Note: The 'addMember' function should be imported from the workspaceController as well,
// but it is not shown in this snippet. Make sure to import it similarly to 'getUserWorkspaces'.
