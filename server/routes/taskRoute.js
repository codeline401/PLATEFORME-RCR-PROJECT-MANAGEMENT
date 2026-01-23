import express from "express"; // Importing Express framework
import {
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/taskController.js"; // Importing the createProject controller function
import { protect } from "../middlewares/authMiddlewares.js"; // Importing the protect middleware

const taskRouter = express.Router(); // Creating a new router for task-related routes

taskRouter.post("/delete", protect, deleteTask); // Defining a POST route for deleting tasks
taskRouter.post("/", protect, createTask); // Defining a POST route for creating a task
taskRouter.put("/:id", protect, updateTask); // Defining a PUT route for updating a task

export default taskRouter; // Exporting the router to be used in other parts of the application
