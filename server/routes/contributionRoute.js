import { Router } from "express";
import {
  createMaterialContribution,
  getProjectContributions,
  approveContribution,
  rejectContribution,
  getMyContributions,
  createFinancialContribution,
  getProjectFinancialContributions,
  approveFinancialContribution,
  rejectFinancialContribution,
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
// FINANCIAL CONTRIBUTION ROUTES
// Gestion des contributions financières
// ============================================================

// Créer une contribution financière
router.post("/financial", createFinancialContribution);

// Récupérer les contributions financières d'un projet
router.get("/financial/project/:projectId", getProjectFinancialContributions);

// Approuver une contribution financière
router.put("/financial/:id/approve", approveFinancialContribution);

// Rejeter une contribution financière
router.put("/financial/:id/reject", rejectFinancialContribution);

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
