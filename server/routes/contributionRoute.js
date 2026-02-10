import { Router } from "express";
import {
  createMaterialContribution,
  getProjectContributions,
  approveContribution,
  rejectContribution,
  getMyContributions,
} from "../controllers/contributionController.js";

const router = Router();

// ============================================================
// CONTRIBUTION ROUTES
// Gestion des contributions de ressources matérielles
// ============================================================

// Créer une nouvelle contribution (authentifié)
router.post("/material", createMaterialContribution);

// Récupérer mes contributions
router.get("/my-contributions", getMyContributions);

// Récupérer les contributions d'un projet (pour le lead)
router.get("/project/:projectId", getProjectContributions);

// Approuver une contribution (Lead uniquement)
router.put("/:id/approve", approveContribution);

// Rejeter une contribution (Lead uniquement)
router.put("/:id/reject", rejectContribution);

export default router;
