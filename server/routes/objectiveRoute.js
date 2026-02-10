import express from "express";
import { protect } from "../middlewares/authMiddlewares.js";
import {
  createObjective,
  getProjectObjectives,
  updateObjective,
  deleteObjective,
  toggleObjective,
  createIndicator,
  updateIndicator,
  deleteIndicator,
} from "../controllers/objectiveController.js";

const objectiveRoute = express.Router();

// Créer un objectif pour un projet
objectiveRoute.post("/project/:projectId", protect, createObjective);

// Récupérer les objectifs d'un projet
objectiveRoute.get("/project/:projectId", protect, getProjectObjectives);

// Mettre à jour un objectif
objectiveRoute.put("/:id", protect, updateObjective);

// Basculer l'état complété/non complété
objectiveRoute.put("/:id/toggle", protect, toggleObjective);

// Supprimer un objectif
objectiveRoute.delete("/:id", protect, deleteObjective);

// ========== INDICATOR ROUTES ==========

// Créer un indicateur pour un objectif
objectiveRoute.post("/:objectiveId/indicators", protect, createIndicator);

// Mettre à jour un indicateur
objectiveRoute.put("/indicators/:id", protect, updateIndicator);

// Supprimer un indicateur
objectiveRoute.delete("/indicators/:id", protect, deleteIndicator);

export default objectiveRoute;
