import express from "express";
import cors from "cors";
import "dotenv/config";

import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";

import { clerkMiddleware } from "@clerk/express"; // import Clerk middleware

import workspaceRouter from "./routes/workspaceRoute.js";
import projectRouter from "./routes/projectRoute.js";
import taskRouter from "./routes/taskRoute.js";
import commentRouter from "./routes/commentRoute.js";
import contactRouter from "./routes/contactRoute.js";
import contributionRouter from "./routes/contributionRoute.js";
import objectiveRouter from "./routes/objectiveRoute.js";
import { protect } from "./middlewares/authMiddlewares.js";
import { getPublicProjects } from "./controllers/projectController.js";

const app = express(); // create an express application

app.use(express.json()); // middleware to parse JSON bodies
app.use(cors()); // middleware to enable CORS
app.use(clerkMiddleware()); // use Clerk middleware for authentication

app.get("/", (req, res) => res.send("Server is Live")); // basic route to test server

// Set up the "/api/inngest" (recommended) routes with the serve handler
app.use("/api/inngest", serve({ client: inngest, functions }));

// Routes
app.use("/api/workspaces", protect, workspaceRouter); // use workspace routes
app.use("/api/projects", protect, projectRouter); // use project routes
app.use("/api/tasks", protect, taskRouter); // use task routes
app.use("/api/comments", protect, commentRouter); // use comment routes
app.use("/api/contributions", protect, contributionRouter); // use contribution routes
app.use("/api/objectives", protect, objectiveRouter); // use objective routes
app.use("/api/contact", contactRouter); // use contact routes (pas protégé - pour les guests)

// Routes publiques (SANS authentification)
app.get("/api/public/projects/all", getPublicProjects); // Récupérer tous les projets publics (pas d'auth req)

const PORT = process.env.PORT || 5000; // get port from environment or use 5000

app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); // start server and listen on specified port
