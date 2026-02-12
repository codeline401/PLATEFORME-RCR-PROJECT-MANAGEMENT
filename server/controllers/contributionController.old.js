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

    // Récupérer les infos du contributeur - chercher par id ou clerkId
    let contributor = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!contributor) {
      contributor = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true, name: true, email: true },
      });
    }

    if (!contributor) {
      return res.status(404).json({
        message: "Utilisateur non trouvé",
      });
    }

    // ========== TOUTES LES CONTRIBUTIONS EN ATTENTE ==========
    // Créer la contribution en PENDING (même pour le Lead)
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

    // Envoyer un email au lead ET aux admins du workspace
    const leadEmail = resource.project.owner.email;
    const leadName = resource.project.owner.name;
    const projectName = resource.project.name;

    // Collecter les emails des admins (excluant le lead s'il est aussi admin)
    const adminEmails = resource.project.workspace.members
      .filter((m) => m.user && m.user.email !== leadEmail)
      .map((m) => m.user.email);

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">📦 Fanolorana materialy vaovao miandry</h2>
        <p>Miarahaba,</p>
        <p>Ny Kamarady <strong>${contributor.name}</strong> dia mikasa hanome fanampiana ao amin'ilay tetikasa <strong>${projectName}</strong>.</p>
        
        <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Ressource:</strong> ${resource.name}</p>
          <p style="margin: 0 0 8px 0;"><strong>Quantité proposée:</strong> ${numericQuantity}</p>
          ${message ? `<p style="margin: 0;"><strong>Message:</strong> ${message}</p>` : ""}
        </div>
        
        <p>Jereo mivantana ao amin'ny Ivo-toerana raha ekenao na tsia izany fanampiana izany.</p>
        
        <p style="color: #71717a; font-size: 12px; margin-top: 32px;">
          — Francis - RCR Project Management
        </p>
      </div>
    `;

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
      // Continue même si l'email échoue
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

    // Recherche utilisateur par id (Clerk ID utilisé comme id) OU par clerkId
    let contributor = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!contributor) {
      contributor = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true, name: true, email: true },
      });
    }

    if (!contributor) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Toutes les contributions commencent en PENDING
    // Le lead/admin doit confirmer la réception manuellement
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

    // Envoyer email au lead ET aux admins du workspace
    const leadEmail = project.owner.email;
    const projectName = project.name;

    // Collecter les emails des admins (excluant le lead s'il est aussi admin)
    const adminEmails = project.workspace.members
      .filter((m) => m.user && m.user.email !== leadEmail)
      .map((m) => m.user.email);

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">💰 Fanohanana ara-bola miandry</h2>
        <p>Miarahaba,</p>
        <p>Ny Kamarady <strong>${contributor.name}</strong> dia nandefa fanohanana ara-bola ho an'ny tetikasa <strong>${projectName}</strong>.</p>

        <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Vola:</strong> ${numericAmount.toLocaleString()} Ar</p>
          <p style="margin: 0;"><strong>Reference:</strong> ${reference}</p>
        </div>

        <p>Azafady hamarino ao amin'ny Ivo-toerana raha voaray.</p>

        <p style="color: #71717a; font-size: 12px; margin-top: 32px;">
          — Francis - RCR Project Management
        </p>
      </div>
    `;

    try {
      // Envoyer au lead
      await sendEmail(
        leadEmail,
        `[${projectName}] Fanohanana ara-bola miandry`,
        emailContent,
      );

      // Envoyer aux admins
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

    // Recherche utilisateur par id (Clerk ID) OU par clerkId
    let currentUser = await prisma.user.findUnique({
      where: { id: clerkUserId },
      select: { id: true },
    });
    if (!currentUser) {
      currentUser = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
        select: { id: true },
      });
    }
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

    const isLead = contribution.project.team_lead === currentUser.id;
    const isAdmin = contribution.project.workspace.members.some(
      (member) => member.userId === currentUser.id && member.role === "ADMIN",
    );

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

    // Envoyer email de confirmation (accusé de réception) au donateur
    try {
      await sendEmail(
        contribution.contributor.email,
        `✓ Voaray ny fanampianao ara-bola`,
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #22c55e;">✓ Voaray ny fanampianao</h2>
            <p>Miarahaba Kamarady ${contribution.contributor.name},</p>
            <p>Voaray ary nekena ny fanampianao ara-bola ho an'ny tetikasa <strong>${contribution.project.name}</strong>.</p>
            
            <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #22c55e;">
              <p style="margin: 0 0 8px 0;"><strong>Vola:</strong> ${contribution.amount.toLocaleString()} Ar</p>
              <p style="margin: 0;"><strong>Reference:</strong> ${contribution.reference || "N/A"}</p>
              <p style="margin: 8px 0 0 0;"><strong>Daty:</strong> ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
            
            <p>Misaotra betsaka amin'ny fanohanana !</p>
            
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

    // Recherche utilisateur par id (Clerk ID) OU par clerkId
    let currentUser = await prisma.user.findUnique({
      where: { id: clerkUserId },
      select: { id: true },
    });
    if (!currentUser) {
      currentUser = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
        select: { id: true },
      });
    }
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

    const isLead = contribution.project.team_lead === currentUser.id;
    const isAdmin = contribution.project.workspace.members.some(
      (member) => member.userId === currentUser.id && member.role === "ADMIN",
    );

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
    const clerkUserId = req.userId;
    const { id } = req.params;

    // Chercher l'utilisateur par id ou clerkId
    let currentUser = await prisma.user.findUnique({
      where: { id: clerkUserId },
      select: { id: true },
    });
    if (!currentUser) {
      currentUser = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
        select: { id: true },
      });
    }
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
    const clerkUserId = req.userId;
    const { id } = req.params;
    const { reason } = req.body; // Raison optionnelle du rejet

    // Chercher l'utilisateur par id ou clerkId
    let currentUser = await prisma.user.findUnique({
      where: { id: clerkUserId },
      select: { id: true },
    });
    if (!currentUser) {
      currentUser = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
        select: { id: true },
      });
    }
    if (!currentUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

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
    if (contribution.project.team_lead !== currentUser.id) {
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
            <p>Salama Kamarady ${contribution.contributor.name},</p>
            <p>Tsy voaray ny fanampiana <strong>${contribution.project.name}</strong> kasainao atolotra</p>
            
            <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #ef4444;">
              <p style="margin: 0 0 8px 0;"><strong>Ressource:</strong> ${contribution.resource.name}</p>
              <p style="margin: 0;"><strong>Quantité:</strong> ${contribution.quantity}</p>
              ${reason ? `<p style="margin: 8px 0 0 0;"><strong>Raison:</strong> ${reason}</p>` : ""}
            </div>
            
            <p>Misaotra betsaka ny amin'ny fandraisanao anjara. Jereo ireo tetikasa hafa izay mbola mila fanampiana.</p>
            
            <p style="color: #71717a; font-size: 12px; margin-top: 32px;">
              Francis — L'équipe RCR Project Management
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
    const clerkUserId = req.userId;

    // Chercher l'utilisateur par id ou clerkId
    let user = await prisma.user.findUnique({
      where: { id: clerkUserId },
      select: { id: true },
    });
    if (!user) {
      user = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
        select: { id: true },
      });
    }
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

// ============================================================
// HUMAN CONTRIBUTION - Participation aux ressources humaines
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

    // Récupérer les infos du participant - chercher par id ou clerkId
    let participant = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!participant) {
      participant = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true, name: true, email: true },
      });
    }

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

    // Email au participant
    try {
      await sendEmail(
        participant.email,
        `Firotsahana voamarina - ${projectName}`,
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #22c55e;">✓ Voamarina ny firotsahanao</h2>
            <p>Miarahaba ${participant.name},</p>
            <p>Voaray soa aman-tsara ny firotsahanao ho <strong>${resource.name}</strong> ao amin'ny tetikasa <strong>${projectName}</strong>.</p>
            
            <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #22c55e;">
              <p style="margin: 0 0 8px 0;"><strong>Andraikitra:</strong> ${resource.name}</p>
              <p style="margin: 0;"><strong>Tetikasa:</strong> ${projectName}</p>
            </div>
            
            <p>Misaotra anao noho ny fandraisanao anjara!</p>
            
            <p style="color: #71717a; font-size: 12px; margin-top: 32px;">
              — L'équipe RCR Project Management
            </p>
          </div>
        `,
      );
    } catch (emailError) {
      console.error("Erreur envoi email participant:", emailError);
    }

    // Email au lead (si ce n'est pas lui qui participe)
    if (!isLead) {
      try {
        await sendEmail(
          leadEmail,
          `[${projectName}] Mpikambana vaovao nirotsaka`,
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #3b82f6;">Mpikambana vaovao</h2>
              <p>Miarahaba ${leadName},</p>
              <p><strong>${participant.name}</strong> dia nirotsaka ho <strong>${resource.name}</strong> ao amin'ny tetikasanao <strong>${projectName}</strong>.</p>
              
              <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p style="margin: 0 0 8px 0;"><strong>Andraikitra:</strong> ${resource.name}</p>
                <p style="margin: 0 0 8px 0;"><strong>Anarana:</strong> ${participant.name}</p>
                <p style="margin: 0;"><strong>Email:</strong> ${participant.email}</p>
                ${message ? `<p style="margin: 8px 0 0 0;"><strong>Hafatra:</strong> ${message}</p>` : ""}
              </div>
              
              <p style="color: #71717a; font-size: 12px; margin-top: 32px;">
                — L'équipe RCR Project Management
              </p>
            </div>
          `,
        );
      } catch (emailError) {
        console.error("Erreur envoi email lead:", emailError);
      }
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

    // Chercher l'utilisateur par id ou clerkId
    let user = await prisma.user.findUnique({
      where: { id: clerkUserId },
      select: { id: true },
    });
    if (!user) {
      user = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
        select: { id: true },
      });
    }
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
