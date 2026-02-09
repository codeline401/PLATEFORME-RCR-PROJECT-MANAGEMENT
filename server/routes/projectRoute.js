import express from "express"; // Importing Express framework
import {
  createProject,
  updateProject,
  addMemberToProject,
  getProject,
  getPublicProjects,
} from "../controllers/projectController.js"; // Importing the createProject controller function

import { protect } from "../middlewares/authMiddlewares.js"; // Importing the protect middleware

import {
  checkProjectAccess,
  checkWritePermissions,
} from "../middlewares/projectMiddlewares.js"; // Importing the checkProjectAccess middleware function

const projectRouter = express.Router(); // Creating a new router for project-related routes

// Route pour les projets publics (SANS authentification - accessible à tous)
projectRouter.get("/public/all", getPublicProjects); // Récupérer tous les projets publics globalement (public)

projectRouter.post("/", createProject); // Defining a POST route for creating a project
projectRouter.put(
  "/:projectId",
  checkProjectAccess,
  checkWritePermissions,
  updateProject,
); // Defining a PUT route for updating a project - FIXED: Added checkProjectAccess
projectRouter.post("/:projectId/addMemberToProject", addMemberToProject); // Defining a POST route for adding members to a project
projectRouter.get("/:projectId", checkProjectAccess, getProject); // Defining a GET route for retrieving a project with access control

export default projectRouter; // Exporting the router to be used in other parts of the application
