import prisma from "../configs/prisma.js";
import { inngest } from "../inngest/index.js";
import { 
  findUserByIdOrClerkId
} from "./helpers/contributionHelpers.js";

// ============================================================
// HUMAN CONTRIBUTION CONTROLLER
// Gestion des participations aux ressources humaines
// ============================================================

/**
 * Participer à une ressource humaine
 * POST /api/contributions/human
 */
export const participateHumanResource = async (req, res) => {
  try {
    const userId = req.userId;
    const { resourceId, projectId, message } = req.body;

    // Validation
    if (!resourceId || !projectId) {
      return res.status(400).json({
        message: "resourceId et projectId sont obligatoires",
      });
    }

    // Vérifier que la ressource existe
    const resource = await prisma.humanResource.findFirst({
      where: { id: resourceId, projectId },
      include: {
        project: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
          },
        },
        participants: {
          include: {
            participant: { select: { id: true } },
          },
        },
      },
    });

    if (!resource) {
      return res.status(404).json({
        message: "Ressource non trouvée",
      });
    }

    // Récupérer les infos du participant
    const participant = await findUserByIdOrClerkId(userId);
    if (!participant) {
      return res.status(404).json({
        message: "Utilisateur non trouvé",
      });
    }

    // Vérifier si l'utilisateur participe déjà
    const alreadyParticipating = resource.participants.some(
      (p) => p.participant.id === participant.id,
    );

    if (alreadyParticipating) {
      return res.status(400).json({
        message: "Efa nirotsaka tamin'ity andraikitra ity ianao",
      });
    }

    // Créer la participation
    const contribution = await prisma.humanContribution.create({
      data: {
        message: message || null,
        resourceId,
        projectId,
        participantId: participant.id,
      },
      include: {
        resource: true,
        participant: {
          select: { id: true, name: true, email: true, image: true },
        },
        project: { select: { id: true, name: true } },
      },
    });

    const projectName = resource.project.name;
    const leadEmail = resource.project.owner.email;
    const leadName = resource.project.owner.name;
    const isLead = resource.project.owner.id === participant.id;

    // Email au participant via Inngest
    await inngest.send({
      name: "app/contribution.human.confirmed",
      data: {
        participantEmail: participant.email,
        participantName: participant.name,
        projectName,
        resourceName: resource.name,
      },
    });

    // Email au lead (si ce n'est pas lui qui participe)
    if (!isLead) {
      await inngest.send({
        name: "app/contribution.human.notify-lead",
        data: {
          leadEmail,
          leadName,
          participantName: participant.name,
          participantEmail: participant.email,
          projectName,
          resourceName: resource.name,
          message,
        },
      });
    }

    res.status(201).json({
      message: "Firotsahana voatahiry soa aman-tsara",
      contribution,
    });
  } catch (error) {
    console.error("Erreur participateHumanResource:", error);
    res.status(500).json({
      message: "Nisy olana tamin'ny firotsahana",
      error: error.message,
    });
  }
};

/**
 * Annuler sa participation
 * DELETE /api/contributions/human/:id
 */
export const cancelHumanParticipation = async (req, res) => {
  try {
    const clerkUserId = req.userId;
    const { id } = req.params;

    const user = await findUserByIdOrClerkId(clerkUserId, { id: true });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifier que la participation existe et appartient à l'utilisateur
    const contribution = await prisma.humanContribution.findFirst({
      where: { id, participantId: user.id },
      include: {
        resource: true,
        project: { select: { id: true, name: true } },
      },
    });

    if (!contribution) {
      return res.status(404).json({
        message: "Participation non trouvée",
      });
    }

    // Supprimer la participation
    await prisma.humanContribution.delete({
      where: { id },
    });

    res.json({
      message: "Participation annulée",
    });
  } catch (error) {
    console.error("Erreur cancelHumanParticipation:", error);
    res.status(500).json({
      message: "Erreur lors de l'annulation",
      error: error.message,
    });
  }
};

/**
 * Récupérer les participants d'une ressource humaine
 * GET /api/contributions/human/resource/:resourceId
 */
export const getHumanResourceParticipants = async (req, res) => {
  try {
    const { resourceId } = req.params;

    const participants = await prisma.humanContribution.findMany({
      where: { resourceId },
      include: {
        participant: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(participants);
  } catch (error) {
    console.error("Erreur getHumanResourceParticipants:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération",
      error: error.message,
    });
  }
};
