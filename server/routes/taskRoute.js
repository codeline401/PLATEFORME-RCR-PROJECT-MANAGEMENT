import express from "express"; // Importing Express framework
import {
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/taskController.js"; // Importing the createProject controller function

const taskRouter = express.Router(); // Creating a new router for task-related routes

taskRouter.post("/", createTask); // Defining a POST route for creating a task
taskRouter.put("/:id", updateTask); // Defining a PUT route for updating a task
taskRouter.delete("/delete", deleteTask); // Defining a DELETE route for deleting tasks

export default taskRouter; // Exporting the router to be used in other parts of the application
