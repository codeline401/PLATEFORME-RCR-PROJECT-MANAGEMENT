import express from "express";
import {
  getUserWorkspaces,
  addWorkspaceMember,
} from "../controllers/workspaceController.js";

const workspaceRouter = express.Router();

workspaceRouter.get("/", getUserWorkspaces);
workspaceRouter.post("/add-member", addWorkspaceMember);

export default workspaceRouter;

// Note: The 'addMember' function should be imported from the workspaceController as well,
// but it is not shown in this snippet. Make sure to import it similarly to 'getUserWorkspaces'.
