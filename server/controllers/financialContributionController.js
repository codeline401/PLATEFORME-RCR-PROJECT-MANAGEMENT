import prisma from "../configs/prisma.js";
import { sendEmail } from "../configs/nodemailer.js";
import { 
  findUserByIdOrClerkId, 
  checkProjectPermissions,
  getAdminEmails, 
  emailTemplates 
} from "./helpers/contributionHelpers.js";

// ============================================================
// FINANCIAL CONTRIBUTION CONTROLLER
// Gestion des contributions financières
// ============================================================

/**
 * Créer une contribution financière (status: PENDING)
 * POST /api/contributions/financial
 */
export const createFinancialContribution = async (req, res) => {
  try {
    const userId = req.userId;
    const { projectId, amount, reference } = req.body;

    console.log("📦 createFinancialContribution - Données reçues:", {
      userId,
      projectId,
      amount,
      reference,
      amountType: typeof amount,
    });

    if (!projectId || !amount || !reference) {
      return res.status(400).json({
        message: "projectId, amount et reference sont obligatoires",
      });
    }

    // Convertir amount en nombre
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        message: "Tokony misy vola 1 farafahakeliny",
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
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
        financialResources: true,
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Tsy hita io tetikasa io" });
    }

    const contributor = await findUserByIdOrClerkId(userId);
    if (!contributor) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Toutes les contributions commencent en PENDING
    const contribution = await prisma.financialContribution.create({
      data: {
        projectId,
        amount: numericAmount,
        reference,
        contributorId: contributor.id,
        status: "PENDING",
      },
      include: {
        contributor: { select: { id: true, name: true, email: true } },
      },
    });

    // Envoyer emails de notification
    const leadEmail = project.owner.email;
    const projectName = project.name;
    const adminEmails = getAdminEmails(project.workspace.members, leadEmail);

    const emailContent = emailTemplates.financialContributionPending({
      contributorName: contributor.name,
      projectName,
      amount: numericAmount,
      reference,
    });

    try {
      await sendEmail(
        leadEmail,
        `[${projectName}] Fanohanana ara-bola miandry`,
        emailContent,
      );

      for (const adminEmail of adminEmails) {
        await sendEmail(
          adminEmail,
          `[${projectName}] Fanohanana ara-bola miandry`,
          emailContent,
        );
      }
    } catch (emailError) {
      console.error("Erreur envoi email:", emailError);
    }

    return res.status(201).json({
      message: "Fanampiana nalefa - miandry famafazana",
      contribution,
      autoApproved: false,
    });
  } catch (error) {
    console.error("Erreur createFinancialContribution:", error);
    console.error("Stack trace:", error.stack);
    return res.status(500).json({
      message: "Erreur lors de la création de la contribution financière",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

/**
 * Récupérer les contributions financières d'un projet
 * GET /api/contributions/financial/project/:projectId
 */
export const getProjectFinancialContributions = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.query;

    const whereClause = { projectId };
    if (status) {
      whereClause.status = status;
    }

    const contributions = await prisma.financialContribution.findMany({
      where: whereClause,
      include: {
        contributor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(contributions);
  } catch (error) {
    console.error("Erreur getProjectFinancialContributions:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des contributions financières",
      error: error.message,
    });
  }
};

/**
 * Approuver une contribution financière (Lead/Admin)
 * PUT /api/contributions/financial/:id/approve
 */
export const approveFinancialContribution = async (req, res) => {
  try {
    const clerkUserId = req.userId;
    const { id } = req.params;

    const currentUser = await findUserByIdOrClerkId(clerkUserId, { id: true });
    if (!currentUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const contribution = await prisma.financialContribution.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            workspace: { include: { members: true } },
          },
        },
        contributor: { select: { id: true, name: true, email: true } },
      },
    });

    if (!contribution) {
      return res.status(404).json({ message: "Tsy hita io fanampiana io" });
    }

    const { isLead, isAdmin } = checkProjectPermissions(contribution.project, currentUser.id);

    if (!isLead && !isAdmin) {
      return res.status(403).json({
        message: "Tsy manana alalana ianao hanamarina io fanampiana io",
      });
    }

    if (contribution.status !== "PENDING") {
      return res.status(400).json({
        message: "Efa voamarina na nolavina io fanampiana io",
      });
    }

    // Mise à jour séquentielle pour éviter timeout transaction avec Neon
    const updatedContribution = await prisma.financialContribution.update({
      where: { id },
      data: { status: "APPROVED" },
    });

    await prisma.financialResource.upsert({
      where: { projectId: contribution.projectId },
      update: { owned: { increment: contribution.amount } },
      create: {
        projectId: contribution.projectId,
        amount: 0,
        owned: contribution.amount,
      },
    });

    // Envoyer email de confirmation au donateur
    try {
      await sendEmail(
        contribution.contributor.email,
        `✓ Voaray ny fanampianao ara-bola`,
        emailTemplates.financialContributionApproved({
          contributorName: contribution.contributor.name,
          projectName: contribution.project.name,
          amount: contribution.amount,
          reference: contribution.reference,
        }),
      );
    } catch (emailError) {
      console.error("Erreur envoi email confirmation:", emailError);
    }

    res.json({
      message: "Fanampiana voamarina",
      contribution: updatedContribution,
    });
  } catch (error) {
    console.error("Erreur approveFinancialContribution:", error);
    res.status(500).json({
      message: "Erreur lors de la validation de la contribution",
      error: error.message,
    });
  }
};

/**
 * Rejeter une contribution financière (Lead ou Admin)
 * PUT /api/contributions/financial/:id/reject
 */
export const rejectFinancialContribution = async (req, res) => {
  try {
    const clerkUserId = req.userId;
    const { id } = req.params;

    const currentUser = await findUserByIdOrClerkId(clerkUserId, { id: true });
    if (!currentUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const contribution = await prisma.financialContribution.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            workspace: { include: { members: true } },
          },
        },
        contributor: { select: { id: true, name: true, email: true } },
      },
    });

    if (!contribution) {
      return res.status(404).json({ message: "Tsy hita io fanampiana io" });
    }

    const { isLead, isAdmin } = checkProjectPermissions(contribution.project, currentUser.id);

    if (!isLead && !isAdmin) {
      return res.status(403).json({
        message: "Tsy manana alalana ianao handà io fanampiana io",
      });
    }

    if (contribution.status !== "PENDING") {
      return res.status(400).json({
        message: "Efa voamarina na nolavina io fanampiana io",
      });
    }

    const updatedContribution = await prisma.financialContribution.update({
      where: { id },
      data: { status: "REJECTED" },
    });

    res.json({
      message: "Fanampiana nolavina",
      contribution: updatedContribution,
    });
  } catch (error) {
    console.error("Erreur rejectFinancialContribution:", error);
    res.status(500).json({
      message: "Erreur lors du rejet de la contribution",
      error: error.message,
    });
  }
};
