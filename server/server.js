import express from "express";
import cors from "cors";
import "dotenv/config";

import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";

import { clerkMiddleware } from "@clerk/express"; // import Clerk middleware

const app = express(); // create an express application

app.use(express.json()); // middleware to parse JSON bodies
app.use(cors()); // middleware to enable CORS
app.use(clerkMiddleware()); // use Clerk middleware for authentication

app.get("/", (req, res) => res.send("Server is Live")); // basic route to test server

// Set up the "/api/inngest" (recommended) routes with the serve handler
app.use("/api/inngest", serve({ client: inngest, functions }));

const PORT = process.env.PORT || 5000; // get port from environment or use 5000

app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); // start server and listen on specified port
