import express from "express"; // Importing Express framework
import {
  createProject,
  updateProject,
  addMemberToProject,
} from "../controllers/projectController.js"; // Importing the createProject controller function

const projectRouter = express.Router(); // Creating a new router for project-related routes

projectRouter.post("/", createProject); // Defining a POST route for creating a project
projectRouter.put("/api/projectId", updateProject); // Defining a PUT route for updating a project
projectRouter.post("/:projectId/addMemberToProject", addMemberToProject); // Defining a POST route for adding members to a project
export default projectRouter; // Exporting the router to be used in other parts of the application
