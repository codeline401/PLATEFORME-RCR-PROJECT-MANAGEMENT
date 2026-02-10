import { Router } from "express";
import {
  createMaterialContribution,
  getProjectContributions,
  approveContribution,
  rejectContribution,
  getMyContributions,
  participateHumanResource,
  cancelHumanParticipation,
  getHumanResourceParticipants,
} from "../controllers/contributionController.js";

const router = Router();

// ============================================================
// MATERIAL CONTRIBUTION ROUTES
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

// ============================================================
// HUMAN CONTRIBUTION ROUTES
// Gestion des participations aux ressources humaines
// ============================================================

// Participer à une ressource humaine
router.post("/human", participateHumanResource);

// Annuler sa participation
router.delete("/human/:id", cancelHumanParticipation);

// Récupérer les participants d'une ressource humaine
router.get("/human/resource/:resourceId", getHumanResourceParticipants);

export default router;
