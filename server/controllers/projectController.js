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
      isPublic = true,
      // Ressources
      materialResources = [],
      humanResources = [],
      financialResources = { needed: 0, owned: 0 },
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
        isPublic: isPublic !== false, // true par défaut
        team_lead: finalTeamLead, // ✅ Utiliser team_lead (String), pas owner (relation)
      },
    });

    console.log(`  ✓ Project créé avec succès: ${project.id}`);

    // ========== 6. AJOUT DES MEMBRES (OPTIONNEL) ==========
    console.log("📝 STEP 6: Ajout des membres du projet");

    // Toujours ajouter le team_lead comme membre
    const memberIds = [finalTeamLead];
    console.log(`  ✓ Team lead (${finalTeamLead}) sera ajouté comme membre`);

    if (team_members && team_members.length > 0) {
      console.log(`  ${team_members.length} membres additionnels à ajouter`);

      // Mapper les emails fournis aux IDs des utilisateurs du workspace
      for (const memberEmail of team_members) {
        const member = workspace.members.find(
          (m) => m.user.email === memberEmail,
        );
        if (member && !memberIds.includes(member.user.id)) {
          memberIds.push(member.user.id);
          console.log(`    ✓ Membre trouvé: ${memberEmail}`);
        } else if (memberIds.includes(member?.user?.id)) {
          console.log(
            `    ℹ️  ${memberEmail} est déjà dans la liste (team_lead)`,
          );
        } else {
          console.log(
            `    ⚠️  Membre non trouvé dans le workspace: ${memberEmail}`,
          );
        }
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
      console.log(`  ℹ️  Aucun membre à ajouter`);
    }

    // ========== 7. CRÉATION DES RESSOURCES ==========
    console.log("📝 STEP 7: Création des ressources");

    // Ressources Matérielles
    if (materialResources && materialResources.length > 0) {
      try {
        await prisma.materialResource.createMany({
          data: materialResources
            .filter((r) => r.name && r.name.trim() !== "")
            .map((r) => ({
              projectId: project.id,
              name: r.name,
              needed: r.needed || 1,
              owned: r.owned || 0,
            })),
        });
        console.log(
          `  ✓ ${materialResources.length} ressources matérielles créées`,
        );
      } catch (err) {
        console.warn(`  ⚠️  Erreur ressources matérielles:`, err.message);
      }
    }

    // Ressources Humaines
    if (humanResources && humanResources.length > 0) {
      try {
        await prisma.humanResource.createMany({
          data: humanResources
            .filter((r) => r.name && r.name.trim() !== "")
            .map((r) => ({
              projectId: project.id,
              name: r.name,
            })),
        });
        console.log(`  ✓ ${humanResources.length} ressources humaines créées`);
      } catch (err) {
        console.warn(`  ⚠️  Erreur ressources humaines:`, err.message);
      }
    }

    // Ressources Financières
    if (
      financialResources &&
      (financialResources.needed > 0 || financialResources.owned > 0)
    ) {
      try {
        await prisma.financialResource.create({
          data: {
            projectId: project.id,
            amount: financialResources.needed || 0,
            owned: financialResources.owned || 0,
          },
        });
        console.log(`  ✓ Ressource financière créée`);
      } catch (err) {
        console.warn(`  ⚠️  Erreur ressource financière:`, err.message);
      }
    }

    // ========== 8. RÉPONSE SUCCÈS ==========
    console.log("📝 STEP 8: Envoi de la réponse");

    // Récupérer le projet avec tous ses membres et ressources
    const projectWithMembers = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        members: {
          include: { user: true },
        },
        materialResources: true,
        humanResources: true,
        financialResources: true,
      },
    });

    console.log(`  ✅ SUCCESS - Project créé avec ID: ${project.id}`);

    return res.status(201).json({
      success: true,
      project: projectWithMembers,
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
  // Logic to update a project
  try {
    // FIX: Utiliser req.userId au lieu de req.auth.userId
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { projectId } = req.params; // Get projectId from URL params

    // vérifier les permissions (ulitiser le middleware)
    if (!req.permissions?.canWrite) {
      return res.status(403).json({
        message:
          "Tsy Mety: Ny Mpandrindra ihany no afaka mitondra fanovàna ny tetikasa.",
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
      team_lead,
      isPublic,
      materialResources,
      humanResources,
      financialResources,
    } = req.body; // get project details from request body

    // Check if user has admin role for workspace
    // FIX: Corriger typo worksapce → workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: { include: { user: true } } },
    });

    // workspace not found
    if (!workspace) {
      return res
        .status(404)
        .json({ message: "Tsy hita na Tsy misy io tranon'Asa io" });
    }

    if (
      !workspace.members.some(
        (member) => member.userId === userId && member.role === "admin",
      ) // check for admin role
    ) {
      const project = await prisma.project.findUnique({
        where: { id: projectId }, // get project by id
      });
      if (!project) {
        // project not found
        return res
          .status(404)
          .json({ message: "Tsy hita na Tsy misy io tetikasa io" });
      } else if (project.team_lead !== userId) {
        // not team lead
        return res.status(403).json({
          message:
            "Tsy Mety: Tsy manana alalana manova ity tetikasa ity ianao.",
        });
      }
    }

    // proceed to update project
    const project = await prisma.project.update({
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
      },
    });

    // Update resources if provided
    // Material Resources
    if (materialResources !== undefined) {
      // Delete existing material resources
      await prisma.materialResource.deleteMany({
        where: { projectId },
      });
      // Create new ones
      if (materialResources.length > 0) {
        await prisma.materialResource.createMany({
          data: materialResources
            .filter((r) => r.name && r.name.trim() !== "")
            .map((r) => ({
              projectId,
              name: r.name,
              needed: r.needed || 1,
              owned: r.owned || 0,
            })),
        });
      }
    }

    // Human Resources
    if (humanResources !== undefined) {
      await prisma.humanResource.deleteMany({
        where: { projectId },
      });
      if (humanResources.length > 0) {
        await prisma.humanResource.createMany({
          data: humanResources
            .filter((r) => r.name && r.name.trim() !== "")
            .map((r) => ({
              projectId,
              name: r.name,
            })),
        });
      }
    }

    // Financial Resources
    if (financialResources !== undefined) {
      await prisma.financialResource.deleteMany({
        where: { projectId },
      });
      if (
        financialResources.length > 0 &&
        (financialResources[0]?.amount > 0 || financialResources[0]?.owned > 0)
      ) {
        await prisma.financialResource.create({
          data: {
            projectId,
            amount: financialResources[0]?.amount || 0,
            owned: financialResources[0]?.owned || 0,
          },
        });
      }
    }

    // Fetch updated project with resources
    const updatedProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: { include: { user: true } },
        materialResources: true,
        humanResources: true,
        financialResources: true,
      },
    });

    //
    res.json({
      project: updatedProject,
      message: "Tetikasa voavao soa aman-tsara",
    });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ message: error.code || error.message });
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

    //Check if member to add exists
    const existingMember = await prisma.members.find(
      (member) => member.user.email === memberEmail,
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

// GET - Lecture pour tous (avec permissions)
export const getProject = async (req, res) => {
  try {
    const userId = req.userId; // FIX: Utiliser req.userId au lieu de req.auth.userId
    const { workspaceId } = req.params; // Récupérer workspaceId depuis les paramètres de l'URL

    // vérifier que le workspace existe & que l'utilisateur a accès
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true }, // Inclure les membres pour vérifier l'accès
    });

    if (!workspace) {
      return res
        .status(404)
        .json({ message: "Tsy hita io tranon'Asa io na Tsy misy !!!" });
    }

    const isMember = workspace.members.some(
      (member) => member.userId === userId,
    ); // Vérifier si l'utilisateur est membre du workspace

    // Si public, afficher les project publics même pour les non-membres
    const filter = {
      workspaceId,
      ...(workspace.isPublic === "PUBLIC" && !isMember && { isPublic: true }), // Si workspace public et user non membre, filtrer pour n'afficher que les projets publics
    };

    const projects = await prisma.project.findMany({
      where: filter, // Appliquer le filtre pour les projets publics si nécessaire
      include: { owner: true, members: true }, // Inclure les données du propriétaire et des membres
    });

    res.json({ projects, message: "Tetikasa azo jerena" });
  } catch (error) {
    res.status(500).json({ message: error.code || error.message });
  }
};

// Récupérer TOUS les projets publics de TOUS les workspaces
export const getPublicProjects = async (req, res) => {
  try {
    console.log("📝 Fetching all public projects...");

    const publicProjects = await prisma.project.findMany({
      where: {
        isPublic: true, // Seulement les projets publics
      },
      include: {
        workspace: {
          include: {
            members: { include: { user: true } },
            owner: true,
          },
        },
        owner: true,
        members: { include: { user: true } },
        tasks: true,
        materialResources: true,
        humanResources: true,
        financialResources: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`✅ Found ${publicProjects.length} public projects`);
    res.json(publicProjects);
  } catch (error) {
    console.error("❌ Error fetching public projects:", error.message);
    res.status(500).json({ message: error.message });
  }
};
