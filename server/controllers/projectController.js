import prisma from "../configs/prisma.js";

export const createProject = async (req, res) => {
  try {
    // ========== 1. RÉCUPÉRATION DES DONNÉES ==========
    console.log("📝 STEP 1: Récupération des données");
    // FIX: Utiliser req.userId au lieu de req.auth.userId (middleware stocke ici)
    const userId = req.userId;

    if (!userId) {
      console.log("  ❌ userId manquant - authentification échouée");
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
    } = req.body;

    // Validation des champs obligatoires
    if (!workspaceId || !name) {
      return res.status(400).json({
        message: "workspaceId et name sont obligatoires",
      });
    }

    console.log(`  ✓ userId: ${userId}`);
    console.log(`  ✓ workspaceId: ${workspaceId}`);
    console.log(`  ✓ name: ${name}`);

    // ========== 2. VÉRIFICATION DU WORKSPACE ==========
    console.log("📝 STEP 2: Vérification du workspace");
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: { include: { user: true } } },
    });

    if (!workspace) {
      console.log("  ❌ Workspace non trouvé");
      return res.status(404).json({ message: "Tsy hita io tranon'Asa io" });
    }
    console.log(`  ✓ Workspace trouvé: ${workspace.name}`);

    // ========== 3. VÉRIFICATION DES PERMISSIONS ==========
    console.log("📝 STEP 3: Vérification des permissions (ADMIN required)");
    const isAdmin = workspace.members.some(
      (member) => member.userId === userId && member.role === "ADMIN",
    );

    if (!isAdmin) {
      console.log(`  ❌ Utilisateur ${userId} n'est pas ADMIN`);
      return res.status(403).json({
        message: "Tsy Mety: Ny Mpandrindra ihany no afaka mamorona tetikasa.",
      });
    }
    console.log(`  ✓ Utilisateur ${userId} est ADMIN`);

    // ========== 4. RÉCUPÉRATION DU TEAM LEAD ==========
    console.log("📝 STEP 4: Récupération du team lead");
    let finalTeamLead = userId; // Par défaut, c'est l'utilisateur courant

    if (team_lead) {
      console.log(`  Recherche team_lead par email: ${team_lead}`);
      const teamLeadUser = await prisma.user.findUnique({
        where: { email: team_lead },
        select: { id: true },
      });

      if (teamLeadUser) {
        finalTeamLead = teamLeadUser.id;
        console.log(`  ✓ Team lead trouvé: ${finalTeamLead}`);
      } else {
        console.log(
          `  ⚠️  Team lead non trouvé, utilisation de l'utilisateur courant`,
        );
      }
    } else {
      console.log(
        `  ℹ️ Pas de team_lead fourni, utilisation de l'utilisateur courant`,
      );
    }

    // ========== 5. CRÉATION DU PROJECT ==========
    console.log("📝 STEP 5: Création du project");
    console.log(
      `  Données: name=${name}, status=${status}, priority=${priority}`,
    );

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
        team_lead: finalTeamLead, // ✅ Utiliser team_lead (String), pas owner (relation)
      },
    });

    console.log(`  ✓ Project créé avec succès: ${project.id}`);

    // ========== 6. AJOUT DES MEMBRES (OPTIONNEL) ==========
    console.log("📝 STEP 6: Ajout des membres du projet");

    if (team_members && team_members.length > 0) {
      console.log(`  ${team_members.length} membres à ajouter`);

      // Mapper les emails fournis aux IDs des utilisateurs du workspace
      const memberIds = [];
      for (const memberEmail of team_members) {
        const member = workspace.members.find(
          (m) => m.user.email === memberEmail,
        );
        if (member) {
          memberIds.push(member.user.id);
          console.log(`    ✓ Membre trouvé: ${memberEmail}`);
        } else {
          console.log(
            `    ⚠️  Membre non trouvé dans le workspace: ${memberEmail}`,
          );
        }
      }

      // Créer les ProjectMembers
      if (memberIds.length > 0) {
        try {
          const result = await prisma.projectMember.createMany({
            data: memberIds.map((userId) => ({
              projectId: project.id,
              userId,
            })),
            skipDuplicates: true,
          });
          console.log(`  ✓ ${result.count} membres ajoutés au project`);
        } catch (memberError) {
          console.warn(
            `  ⚠️  Erreur lors de l'ajout des membres:`,
            memberError.message,
          );
          // On continue quand même - le project a été créé
        }
      } else {
        console.log(`  ℹ️  Aucun membre valide trouvé à ajouter`);
      }
    } else {
      console.log(`  ℹ️  Aucun membre à ajouter`);
    }

    // ========== 7. RÉPONSE SUCCÈS ==========
    console.log("📝 STEP 7: Envoi de la réponse");
    console.log(`  ✅ SUCCESS - Project créé avec ID: ${project.id}`);

    return res.status(201).json({
      success: true,
      project,
      message: "Tetikasa voaforina soa aman-tsara",
    });
  } catch (error) {
    // ========== GESTION DES ERREURS ==========
    console.error("❌ ERREUR FATALE dans createProject:");
    console.error("  Message:", error.message);
    console.error("  Code:", error.code);
    console.error("  Meta:", error.meta);
    if (error.stack) {
      console.error("  Stack trace:", error.stack);
    }

    return res.status(500).json({
      success: false,
      message: "Nisy zavatra tsy nety tamin'ny famoronana tetikasa.",
      error: {
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
        meta: error.meta,
      },
    });
  }
};

// update project
export const updateProject = async (req, res) => {
  try {
    // ========== 1. RÉCUPÉRATION DES DONNÉES ==========
    console.log("📝 STEP 1: Récupération des données");
    const userId = req.userId;
    const { projectId } = req.params; // FIX: Récupérer projectId des paramètres

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!projectId) {
      return res.status(400).json({ message: "projectId manquant" });
    }

    const {
      description,
      name,
      status,
      start_date,
      end_date,
      progress,
      priority,
    } = req.body;

    console.log(`  ✓ projectId: ${projectId}`);
    console.log(`  ✓ userId: ${userId}`);

    // ========== 2. VÉRIFICATION DU PROJECT ==========
    console.log("📝 STEP 2: Vérification du project");
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { workspace: { include: { members: true } } },
    });

    if (!project) {
      console.log(`  ❌ Project ${projectId} non trouvé`);
      return res
        .status(404)
        .json({ message: "Tsy hita na Tsy misy io tetikasa io" });
    }
    console.log(`  ✓ Project trouvé: ${project.name}`);

    // ========== 3. VÉRIFICATION DES PERMISSIONS ==========
    console.log("📝 STEP 3: Vérification des permissions");
    const workspace = project.workspace;

    // FIX: Vérifier si user est ADMIN du workspace OU team_lead du project
    const isAdmin = workspace.members.some(
      (m) => m.userId === userId && m.role === "ADMIN",
    );
    const isTeamLead = project.team_lead === userId;

    if (!isAdmin && !isTeamLead) {
      console.log(`  ❌ Utilisateur ${userId} n'a pas les permissions`);
      return res.status(403).json({
        message: "Tsy Mety: Tsy manana alalana manova ity tetikasa ity ianao.",
      });
    }
    console.log(
      `  ✓ Permissions OK (isAdmin: ${isAdmin}, isTeamLead: ${isTeamLead})`,
    );

    // ========== 4. MISE À JOUR DU PROJECT ==========
    console.log("📝 STEP 4: Mise à jour du project");
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: name || project.name,
        description: description || project.description,
        status: status || project.status,
        priority: priority || project.priority,
        start_date: start_date ? new Date(start_date) : project.start_date,
        end_date: end_date ? new Date(end_date) : project.end_date,
        progress: progress !== undefined ? progress : project.progress,
      },
    });

    console.log(`  ✓ Project mis à jour: ${updatedProject.id}`);

    // ========== 5. RÉPONSE ==========
    console.log("✅ SUCCESS - Project mis à jour");
    return res.json({
      project: updatedProject,
      message: "Tetikasa voavao soa aman-tsara",
    });
  } catch (error) {
    console.error("❌ ERREUR updateProject:");
    console.error("  Message:", error.message);
    console.error("  Code:", error.code);
    console.error("  Stack:", error.stack);
    return res.status(500).json({
      message: error.message || "Erreur lors de la mise à jour du project",
      code: error.code,
    });
  }
};

// Add member to project
export const addMemberToProject = async (req, res) => {
  try {
    // Logic to add member to a project
    // FIX: Utiliser req.userId au lieu de req.auth.userId
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { projectId } = req.params; // get projectId from request params
    const { memberEmail } = req.body; // get member email from request body

    // Check if user is project team lead
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { include: { user: true } } },
    });

    // project not found
    if (!project) {
      return res
        .status(404)
        .json({ message: "Tsy hita na Tsy misy io tetikasa io" });
    }

    if (project.team_lead !== userId) {
      return res.status(403).json({
        message:
          "Tsy Mety: Ny Mpandindra ny tentikasa ihany no afaka manampy mpikambana vaovao.",
      });
    }

    // FIX: Corriger prisma.members.find() → prisma.projectMember.findFirst()
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        user: { email: memberEmail },
      },
      include: { user: true },
    });

    if (existingMember) {
      return res.status(400).json({
        message: "Efa mpikambana ao anaty Tetikasa io kasainao ampidirina io",
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
      data: {
        projectId,
        userId: user.id,
      },
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
