import prisma from "../configs/prisma.js";
import { sendEmail } from "../configs/nodemailer.js";

// ============================================================
// CONTRIBUTION CONTROLLER
// Gestion des contributions de ressources matérielles
// ============================================================

/**
 * Créer une nouvelle contribution (status: PENDING)
 * POST /api/contributions/material
 */
export const createMaterialContribution = async (req, res) => {
  try {
    const userId = req.userId;
    const { resourceId, projectId, quantity, message } = req.body;

    // Validation des champs obligatoires
    if (!resourceId || !projectId || !quantity) {
      return res.status(400).json({
        message: "resourceId, projectId et quantity sont obligatoires",
      });
    }

    if (quantity < 1) {
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
    const contributor = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!contributor) {
      return res.status(404).json({
        message: "Utilisateur non trouvé",
      });
    }

    // Vérifier si le contributeur est le Lead du projet
    const isLead = resource.project.owner.id === userId;

    if (isLead) {
      // ========== CAS LEAD : Auto-approbation ==========
      // Transaction: créer contribution approuvée + mettre à jour la ressource
      const [contribution, updatedResource] = await prisma.$transaction([
        prisma.materialContribution.create({
          data: {
            quantity,
            message: message || null,
            resourceId,
            projectId,
            contributorId: userId,
            status: "APPROVED", // Auto-approuvé
          },
          include: {
            resource: true,
            contributor: { select: { id: true, name: true, email: true } },
            project: { select: { id: true, name: true } },
          },
        }),
        prisma.materialResource.update({
          where: { id: resourceId },
          data: {
            owned: { increment: quantity },
          },
        }),
      ]);

      return res.status(201).json({
        message: "Contribution enregistrée (auto-approuvée)",
        contribution,
        resource: updatedResource,
        autoApproved: true,
      });
    }

    // ========== CAS MEMBRE : Contribution en attente ==========
    // Créer la contribution en PENDING
    const contribution = await prisma.materialContribution.create({
      data: {
        quantity,
        message: message || null,
        resourceId,
        projectId,
        contributorId: userId,
        status: "PENDING",
      },
      include: {
        resource: true,
        contributor: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    // Envoyer un email au lead du projet
    const leadEmail = resource.project.owner.email;
    const leadName = resource.project.owner.name;
    const projectName = resource.project.name;

    try {
      await sendEmail(
        leadEmail,
        `[${projectName}] Fanampiana vaovao miandry`,
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">Fikasàna fanampiana</h2>
            <p>Miarahaba ${leadName},</p>
            <p>Ny Kamarady <strong>${contributor.name}</strong> dia mikasa hanome fanampiana ao amin'ilay tetikasa <strong>${projectName}</strong>.</p>
            
            <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 0 0 8px 0;"><strong>Ressource:</strong> ${resource.name}</p>
              <p style="margin: 0 0 8px 0;"><strong>Quantité proposée:</strong> ${quantity}</p>
              ${message ? `<p style="margin: 0;"><strong>Message:</strong> ${message}</p>` : ""}
            </div>
            
            <p>Jereo mivantana ao amin'ny Ivo-toerana raha ekenao na tsia izany fanampiana izany</p>
            
            <p style="color: #71717a; font-size: 12px; margin-top: 32px;">
              — Francis - RCR Project Management
            </p>
          </div>
        `,
      );
    } catch (emailError) {
      console.error("Erreur envoi email:", emailError);
      // Continue même si l'email échoue
    }

    res.status(201).json({
      message: "Contribution créée avec succès",
      contribution,
    });
  } catch (error) {
    console.error("Erreur createMaterialContribution:", error);
    res.status(500).json({
      message: "Erreur lors de la création de la contribution",
      error: error.message,
    });
  }
};

/**
 * Récupérer toutes les contributions d'un projet
 * GET /api/contributions/project/:projectId
 */
export const getProjectContributions = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.query; // Filtrer par status optionnel

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
 * Approuver une contribution (Lead uniquement)
 * PUT /api/contributions/:id/approve
 */
export const approveContribution = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

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
    if (contribution.project.team_lead !== userId) {
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

    // Transaction: mettre à jour la contribution ET la ressource
    const [updatedContribution, updatedResource] = await prisma.$transaction([
      prisma.materialContribution.update({
        where: { id },
        data: { status: "APPROVED" },
        include: {
          resource: true,
          contributor: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.materialResource.update({
        where: { id: contribution.resourceId },
        data: {
          owned: { increment: contribution.quantity },
        },
      }),
    ]);

    // Envoyer un email de confirmation au contributeur
    try {
      await sendEmail(
        contribution.contributor.email,
        `Nekene ilay fanampianao !`,
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #22c55e;">✓ Nekena ilay fanampianao</h2>
            <p>Miarahaba Kamarady ${contribution.contributor.name},</p>
            <p>Vaoray ary nekena ny fanampianao ao amin'ny ilay tetikasa <strong>${contribution.project.name}</strong>.</p>
            
            <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #22c55e;">
              <p style="margin: 0 0 8px 0;"><strong>Ressource:</strong> ${contribution.resource.name}</p>
              <p style="margin: 0;"><strong>Quantité:</strong> ${contribution.quantity}</p>
            </div>
            
            <p>Misaotra betsaka amin'ny fanampianao !</p>
            
            <p style="color: #71717a; font-size: 12px; margin-top: 32px;">
              — Francis - RCR Project Management
            </p>
          </div>
        `,
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
 * Rejeter une contribution (Lead uniquement)
 * PUT /api/contributions/:id/reject
 */
export const rejectContribution = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { reason } = req.body; // Raison optionnelle du rejet

    // Récupérer la contribution
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

    // Vérifier que l'utilisateur est le lead
    if (contribution.project.team_lead !== userId) {
      return res.status(403).json({
        message: "Seul le responsable du projet peut rejeter les contributions",
      });
    }

    // Vérifier que la contribution est en attente
    if (contribution.status !== "PENDING") {
      return res.status(400).json({
        message: `Cette contribution est déjà ${contribution.status === "APPROVED" ? "approuvée" : "rejetée"}`,
      });
    }

    // Mettre à jour le status
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
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ef4444;">Contribution non retenue</h2>
            <p>Bonjour ${contribution.contributor.name},</p>
            <p>Votre proposition de contribution au projet <strong>${contribution.project.name}</strong> n'a pas été retenue.</p>
            
            <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #ef4444;">
              <p style="margin: 0 0 8px 0;"><strong>Ressource:</strong> ${contribution.resource.name}</p>
              <p style="margin: 0;"><strong>Quantité:</strong> ${contribution.quantity}</p>
              ${reason ? `<p style="margin: 8px 0 0 0;"><strong>Raison:</strong> ${reason}</p>` : ""}
            </div>
            
            <p>Merci pour votre intérêt pour ce projet.</p>
            
            <p style="color: #71717a; font-size: 12px; margin-top: 32px;">
              — L'équipe RCR Project Management
            </p>
          </div>
        `,
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
    const userId = req.userId;

    const contributions = await prisma.materialContribution.findMany({
      where: { contributorId: userId },
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
