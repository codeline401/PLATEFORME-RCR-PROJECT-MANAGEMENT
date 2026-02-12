import prisma from "../configs/prisma.js";
import { sendEmail } from "../configs/nodemailer.js";
import { 
  findUserByIdOrClerkId, 
  getAdminEmails, 
  emailTemplates 
} from "./helpers/contributionHelpers.js";

// ============================================================
// MATERIAL CONTRIBUTION CONTROLLER
// Gestion des contributions de ressources matérielles
// ============================================================

/**
 * Créer une nouvelle contribution matérielle (status: PENDING)
 * POST /api/contributions/material
 */
export const createMaterialContribution = async (req, res) => {
  try {
    const userId = req.userId;
    const { resourceId, projectId, quantity, message } = req.body;

    console.log("📦 createMaterialContribution - Données reçues:", {
      userId,
      resourceId,
      projectId,
      quantity,
      quantityType: typeof quantity,
      message,
    });

    // Validation des champs obligatoires
    if (!resourceId || !projectId || !quantity) {
      return res.status(400).json({
        message: "resourceId, projectId et quantity sont obligatoires",
      });
    }

    // Convertir quantity en nombre
    const numericQuantity = parseInt(quantity, 10);
    if (isNaN(numericQuantity) || numericQuantity < 1) {
      return res.status(400).json({
        message: "Tokony misy isa 1 farafahakeliny ny fanampiana atolotrao",
      });
    }

    // Vérifier que la ressource existe et appartient au projet
    const resource = await prisma.materialResource.findFirst({
      where: { id: resourceId, projectId },
      include: {
        project: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
            workspace: {
              include: {
                members: {
                  where: { role: "ADMIN" },
                  include: { user: { select: { id: true, name: true, email: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!resource) {
      return res.status(404).json({
        message: "Ressource non trouvée",
      });
    }

    // Récupérer les infos du contributeur
    const contributor = await findUserByIdOrClerkId(userId);
    if (!contributor) {
      return res.status(404).json({
        message: "Utilisateur non trouvé",
      });
    }

    // Créer la contribution en PENDING
    const contribution = await prisma.materialContribution.create({
      data: {
        quantity: numericQuantity,
        message: message || null,
        resourceId,
        projectId,
        contributorId: contributor.id,
        status: "PENDING",
      },
      include: {
        resource: true,
        contributor: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    // Envoyer emails de notification
    const leadEmail = resource.project.owner.email;
    const projectName = resource.project.name;
    const adminEmails = getAdminEmails(resource.project.workspace.members, leadEmail);

    const emailContent = emailTemplates.materialContributionPending({
      contributorName: contributor.name,
      projectName,
      resourceName: resource.name,
      quantity: numericQuantity,
      message,
    });

    try {
      // Envoyer au lead
      await sendEmail(
        leadEmail,
        `[${projectName}] Fanolorana materialy miandry`,
        emailContent,
      );

      // Envoyer aux admins
      for (const adminEmail of adminEmails) {
        await sendEmail(
          adminEmail,
          `[${projectName}] Fanolorana materialy miandry`,
          emailContent,
        );
      }
    } catch (emailError) {
      console.error("Erreur envoi email:", emailError);
    }

    res.status(201).json({
      message: "Contribution créée avec succès (miandry fankatoavana)",
      contribution,
    });
  } catch (error) {
    console.error("Erreur createMaterialContribution:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      message: "Erreur lors de la création de la contribution",
      error: error.message,
    });
  }
};

/**
 * Récupérer toutes les contributions matérielles d'un projet
 * GET /api/contributions/project/:projectId
 */
export const getProjectContributions = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.query;

    const whereClause = { projectId };
    if (status) {
      whereClause.status = status;
    }

    const contributions = await prisma.materialContribution.findMany({
      where: whereClause,
      include: {
        resource: {
          select: { id: true, name: true, needed: true, owned: true },
        },
        contributor: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(contributions);
  } catch (error) {
    console.error("Erreur getProjectContributions:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des contributions",
      error: error.message,
    });
  }
};

/**
 * Approuver une contribution matérielle (Lead uniquement)
 * PUT /api/contributions/:id/approve
 */
export const approveContribution = async (req, res) => {
  try {
    const clerkUserId = req.userId;
    const { id } = req.params;

    const currentUser = await findUserByIdOrClerkId(clerkUserId, { id: true });
    if (!currentUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Récupérer la contribution avec les infos du projet
    const contribution = await prisma.materialContribution.findUnique({
      where: { id },
      include: {
        resource: true,
        project: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
          },
        },
        contributor: { select: { id: true, name: true, email: true } },
      },
    });

    if (!contribution) {
      return res.status(404).json({
        message: "Tsy hita io fanampiana io",
      });
    }

    // Vérifier que l'utilisateur est le lead du projet
    if (contribution.project.team_lead !== currentUser.id) {
      return res.status(403).json({
        message:
          "Ny mpandrindra ny tetikasa ihany no afaka manaiky na tsia ny fanampiana",
      });
    }

    // Vérifier que la contribution est en attente
    if (contribution.status !== "PENDING") {
      return res.status(400).json({
        message: `Efa ${contribution.status === "APPROVED" ? "nekena" : "lavina"} io fanampiana io`,
      });
    }

    // Mise à jour séquentielle pour éviter timeout transaction avec Neon
    const updatedContribution = await prisma.materialContribution.update({
      where: { id },
      data: { status: "APPROVED" },
      include: {
        resource: true,
        contributor: { select: { id: true, name: true, email: true } },
      },
    });

    const updatedResource = await prisma.materialResource.update({
      where: { id: contribution.resourceId },
      data: {
        owned: { increment: contribution.quantity },
      },
    });

    // Envoyer un email de confirmation au contributeur
    try {
      await sendEmail(
        contribution.contributor.email,
        `Nekene ilay fanampianao !`,
        emailTemplates.materialContributionApproved({
          contributorName: contribution.contributor.name,
          projectName: contribution.project.name,
          resourceName: contribution.resource.name,
          quantity: contribution.quantity,
        }),
      );
    } catch (emailError) {
      console.error("Erreur envoi email confirmation:", emailError);
    }

    res.json({
      message: "Fanampiana nekena ara-dalàna",
      contribution: updatedContribution,
      resource: updatedResource,
    });
  } catch (error) {
    console.error("Erreur approveContribution:", error);
    res.status(500).json({
      message: "Nisy olana tena amin'ny fanekena ilay fanampiana",
      error: error.message,
    });
  }
};

/**
 * Rejeter une contribution matérielle (Lead uniquement)
 * PUT /api/contributions/:id/reject
 */
export const rejectContribution = async (req, res) => {
  try {
    const clerkUserId = req.userId;
    const { id } = req.params;
    const { reason } = req.body;

    const currentUser = await findUserByIdOrClerkId(clerkUserId, { id: true });
    if (!currentUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const contribution = await prisma.materialContribution.findUnique({
      where: { id },
      include: {
        resource: true,
        project: {
          include: {
            owner: { select: { id: true, name: true } },
          },
        },
        contributor: { select: { id: true, name: true, email: true } },
      },
    });

    if (!contribution) {
      return res.status(404).json({
        message: "Contribution non trouvée",
      });
    }

    if (contribution.project.team_lead !== currentUser.id) {
      return res.status(403).json({
        message: "Seul le responsable du projet peut rejeter les contributions",
      });
    }

    if (contribution.status !== "PENDING") {
      return res.status(400).json({
        message: `Cette contribution est déjà ${contribution.status === "APPROVED" ? "approuvée" : "rejetée"}`,
      });
    }

    const updatedContribution = await prisma.materialContribution.update({
      where: { id },
      data: { status: "REJECTED" },
      include: {
        resource: true,
        contributor: { select: { id: true, name: true, email: true } },
      },
    });

    // Envoyer un email au contributeur
    try {
      await sendEmail(
        contribution.contributor.email,
        `Contribution non retenue`,
        emailTemplates.materialContributionRejected({
          contributorName: contribution.contributor.name,
          projectName: contribution.project.name,
          resourceName: contribution.resource.name,
          quantity: contribution.quantity,
          reason,
        }),
      );
    } catch (emailError) {
      console.error("Erreur envoi email rejet:", emailError);
    }

    res.json({
      message: "Contribution rejetée",
      contribution: updatedContribution,
    });
  } catch (error) {
    console.error("Erreur rejectContribution:", error);
    res.status(500).json({
      message: "Erreur lors du rejet de la contribution",
      error: error.message,
    });
  }
};

/**
 * Récupérer les contributions d'un utilisateur
 * GET /api/contributions/my-contributions
 */
export const getMyContributions = async (req, res) => {
  try {
    const clerkUserId = req.userId;

    const user = await findUserByIdOrClerkId(clerkUserId, { id: true });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const contributions = await prisma.materialContribution.findMany({
      where: { contributorId: user.id },
      include: {
        resource: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(contributions);
  } catch (error) {
    console.error("Erreur getMyContributions:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération de vos contributions",
      error: error.message,
    });
  }
};
