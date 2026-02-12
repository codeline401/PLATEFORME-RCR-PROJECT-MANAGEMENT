import prisma from "../configs/prisma.js";
import {
  createMaterialResources,
  createHumanResources,
  createFinancialResources,
  updateMaterialResources,
  updateHumanResources,
  updateFinancialResources,
  projectIncludeRelations,
  projectPublicIncludeRelations,
} from "./services/projectResourcesService.js";
import {
  validateCreateProjectFields,
  validateTreasurerInfo,
  validateTreasurerInfoForUpdate,
  isWorkspaceAdmin,
  isWorkspaceMember,
} from "./helpers/projectValidation.js";

// ============================================================
// PROJECT CONTROLLER (REFACTORED)
// Gestion des projets - CRUD operations
// ============================================================

/**
 * Créer un nouveau projet
 * POST /api/projects
 */
export const createProject = async (req, res) => {
  try {
    console.log("📝 STEP 1: Récupération des données");
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      workspaceId,
      description,
      name,
      status,
      start_date,
      end_date,
      team_members = [],
      team_lead,
      progress,
      priority,
      isPublic = true,
      treasurerName,
      treasurerPhone,
      materialResources = [],
      humanResources = [],
      financialResources = { needed: 0, owned: 0 },
    } = req.body;

    // Validation des champs obligatoires
    const fieldValidation = validateCreateProjectFields(req.body);
    if (!fieldValidation.isValid) {
      return res.status(400).json({ message: fieldValidation.message });
    }

    // Validation du trésorier
    const treasurerValidation = validateTreasurerInfo(
      financialResources,
      treasurerName,
      treasurerPhone
    );
    if (!treasurerValidation.isValid) {
      return res.status(400).json({ message: treasurerValidation.message });
    }

    console.log(`  ✓ userId: ${userId}, workspaceId: ${workspaceId}, name: ${name}`);

    // Vérification du workspace
    console.log("📝 STEP 2: Vérification du workspace");
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: { include: { user: true } } },
    });

    if (!workspace) {
      return res.status(404).json({ message: "Tsy hita io tranon'Asa io" });
    }

    // Vérification des permissions
    console.log("📝 STEP 3: Vérification des permissions");
    if (!isWorkspaceAdmin(workspace, userId)) {
      return res.status(403).json({
        message: "Tsy Mety: Ny Mpandrindra ihany no afaka mamorona tetikasa.",
      });
    }

    // Récupération du team lead
    console.log("📝 STEP 4: Récupération du team lead");
    let finalTeamLead = userId;
    if (team_lead) {
      const teamLeadUser = await prisma.user.findUnique({
        where: { email: team_lead },
        select: { id: true },
      });
      if (teamLeadUser) {
        finalTeamLead = teamLeadUser.id;
      }
    }

    // Création du projet
    console.log("📝 STEP 5: Création du project");
    const project = await prisma.project.create({
      data: {
        workspaceId,
        name,
        description,
        status: status || "ACTIVE",
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        progress: progress || 0,
        priority: priority || "MEDIUM",
        isPublic: isPublic !== false,
        team_lead: finalTeamLead,
        treasurerName: treasurerValidation.normalizedTreasurerName || null,
        treasurerPhone: treasurerValidation.normalizedTreasurerPhone || null,
      },
    });

    // Ajout des membres
    console.log("📝 STEP 6: Ajout des membres");
    const memberIds = [finalTeamLead];
    if (team_members && team_members.length > 0) {
      for (const memberEmail of team_members) {
        const member = workspace.members.find((m) => m.user.email === memberEmail);
        if (member && !memberIds.includes(member.user.id)) {
          memberIds.push(member.user.id);
        }
      }
    }

    if (memberIds.length > 0) {
      await prisma.projectMember.createMany({
        data: memberIds.map((memberId) => ({
          projectId: project.id,
          userId: memberId,
        })),
        skipDuplicates: true,
      });
    }

    // Création des ressources
    console.log("📝 STEP 7: Création des ressources");
    try {
      await createMaterialResources(project.id, materialResources);
    } catch (err) {
      console.warn(`  ⚠️ Erreur ressources matérielles:`, err.message);
    }

    try {
      await createHumanResources(project.id, humanResources);
    } catch (err) {
      console.warn(`  ⚠️ Erreur ressources humaines:`, err.message);
    }

    try {
      await createFinancialResources(project.id, financialResources);
    } catch (err) {
      console.warn(`  ⚠️ Erreur ressource financière:`, err.message);
    }

    // Récupérer le projet complet
    console.log("📝 STEP 8: Envoi de la réponse");
    const projectWithMembers = await prisma.project.findUnique({
      where: { id: project.id },
      include: projectIncludeRelations,
    });

    console.log(`  ✅ SUCCESS - Project créé avec ID: ${project.id}`);

    return res.status(201).json({
      success: true,
      project: projectWithMembers,
      message: "Tetikasa voaforina soa aman-tsara",
    });
  } catch (error) {
    console.error("❌ ERREUR FATALE dans createProject:", error.message);
    return res.status(500).json({
      success: false,
      message: "Nisy zavatra tsy nety tamin'ny famoronana tetikasa.",
      error: { message: error.message, code: error.code || "UNKNOWN_ERROR" },
    });
  }
};

/**
 * Mettre à jour un projet
 * PUT /api/projects/:projectId
 */
export const updateProject = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { projectId } = req.params;

    // Vérifier les permissions
    if (!req.permissions?.canWrite) {
      return res.status(403).json({
        message: "Tsy Mety: Ny Mpandrindra ihany no afaka mitondra fanovàna ny tetikasa.",
      });
    }

    const {
      workspaceId,
      description,
      name,
      status,
      start_date,
      end_date,
      progress,
      priority,
      isPublic,
      treasurerName,
      treasurerPhone,
      materialResources,
      humanResources,
      financialResources,
    } = req.body;

    // Vérifier le workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: { include: { user: true } } },
    });

    if (!workspace) {
      return res.status(404).json({ message: "Tsy hita na Tsy misy io tranon'Asa io" });
    }

    // Vérifier les permissions workspace/projet
    if (!isWorkspaceAdmin(workspace, userId)) {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) {
        return res.status(404).json({ message: "Tsy hita na Tsy misy io tetikasa io" });
      }
      if (project.team_lead !== userId) {
        return res.status(403).json({
          message: "Tsy Mety: Tsy manana alalana manova ity tetikasa ity ianao.",
        });
      }
    }

    // Récupérer le projet actuel
    const currentProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: { financialResources: true },
    });

    if (!currentProject) {
      return res.status(404).json({ message: "Tsy hita na Tsy misy io tetikasa io" });
    }

    // Valider le trésorier
    const treasurerValidation = validateTreasurerInfoForUpdate(
      currentProject,
      financialResources,
      treasurerName,
      treasurerPhone
    );
    if (!treasurerValidation.isValid) {
      return res.status(400).json({ message: treasurerValidation.message });
    }

    // Mettre à jour le projet
    await prisma.project.update({
      where: { id: projectId },
      data: {
        name,
        description,
        status,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        progress,
        priority,
        isPublic: typeof isPublic === "boolean" ? isPublic : undefined,
        treasurerName:
          treasurerValidation.normalizedTreasurerName !== undefined
            ? treasurerValidation.normalizedTreasurerName || null
            : undefined,
        treasurerPhone:
          treasurerValidation.normalizedTreasurerPhone !== undefined
            ? treasurerValidation.normalizedTreasurerPhone || null
            : undefined,
      },
    });

    // Mettre à jour les ressources
    await updateMaterialResources(projectId, materialResources);
    await updateHumanResources(projectId, humanResources);
    await updateFinancialResources(projectId, financialResources);

    // Récupérer le projet mis à jour
    const updatedProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: projectIncludeRelations,
    });

    res.json({
      project: updatedProject,
      message: "Tetikasa voavao soa aman-tsara",
    });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ message: error.code || error.message });
  }
};

/**
 * Ajouter un membre au projet
 * POST /api/projects/:projectId/members
 */
export const addMemberToProject = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { projectId } = req.params;
    const { memberEmail } = req.body;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { include: { user: true } } },
    });

    if (!project) {
      return res.status(404).json({ message: "Tsy hita na Tsy misy io tetikasa io" });
    }

    if (project.team_lead !== userId) {
      return res.status(403).json({
        message: "Tsy Mety: Ny Mpandindra ny tentikasa ihany no afaka manampy mpikambana vaovao.",
      });
    }

    const existingMember = project.members.find(
      (member) => member.user.email === memberEmail
    );

    if (existingMember) {
      return res.status(400).json({
        message: "Efa mpikamabana ao anaty Tetikasa io kasainao ampidirina io",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: memberEmail },
    });

    if (!user) {
      return res.status(404).json({
        message: "Tsy hita na Tsy misy io mpikambana io kasainao ampidirina io",
      });
    }

    const member = await prisma.projectMember.create({
      data: { projectId, userId: user.id },
    });

    res.json({
      member,
      message: "Mpikambana tafiditra soa aman-tsaraao anaty tetikasa",
    });
  } catch (error) {
    console.error("Error adding member to project:", error);
    res.status(500).json({ message: error.code || error.message });
  }
};

/**
 * Récupérer les projets d'un workspace
 * GET /api/projects/workspace/:workspaceId
 */
export const getProject = async (req, res) => {
  try {
    const userId = req.userId;
    const { workspaceId } = req.params;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    });

    if (!workspace) {
      return res.status(404).json({ message: "Tsy hita io tranon'Asa io na Tsy misy !!!" });
    }

    const isMember = isWorkspaceMember(workspace, userId);

    const filter = {
      workspaceId,
      ...(workspace.isPublic === "PUBLIC" && !isMember && { isPublic: true }),
    };

    const projects = await prisma.project.findMany({
      where: filter,
      include: { owner: true, members: true },
    });

    res.json({ projects, message: "Tetikasa azo jerena" });
  } catch (error) {
    res.status(500).json({ message: error.code || error.message });
  }
};

/**
 * Récupérer tous les projets publics
 * GET /api/projects/public
 */
export const getPublicProjects = async (req, res) => {
  try {
    console.log("📝 Fetching all public projects...");

    const publicProjects = await prisma.project.findMany({
      where: { isPublic: true },
      include: projectPublicIncludeRelations,
      orderBy: { createdAt: "desc" },
    });

    console.log(`✅ Found ${publicProjects.length} public projects`);
    res.json(publicProjects);
  } catch (error) {
    console.error("❌ Error fetching public projects:", error.message);
    res.status(500).json({ message: error.message });
  }
};
