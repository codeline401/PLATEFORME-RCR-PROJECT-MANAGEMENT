import prisma from "../configs/prisma.js";

export const createProject = async (req, res) => {
  try {
    const clerkId = req.userId;

    if (!clerkId) {
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

    if (!workspaceId || !name) {
      return res.status(400).json({
        message: "workspaceId et name sont obligatoires",
      });
    }

    // Trouver l'utilisateur par clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const userId = user.id;

    // Vérifier le workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: { include: { user: true } } },
    });

    if (!workspace) {
      return res.status(404).json({ message: "Tsy hita io tranon'Asa io" });
    }

    // Vérifier permissions
    const isAdmin = workspace.members.some(
      (member) => member.userId === userId && member.role === "ADMIN",
    );

    if (!isAdmin) {
      return res.status(403).json({
        message: "Tsy Mety: Ny Mpandrindra ihany no afaka mamorona tetikasa.",
      });
    }

    // Récupération du team lead
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
        team_lead: finalTeamLead,
      },
    });

    // Ajout des membres
    if (team_members && team_members.length > 0) {
      const memberIds = [];
      for (const memberEmail of team_members) {
        const member = workspace.members.find(
          (m) => m.user.email === memberEmail,
        );
        if (member) {
          memberIds.push(member.user.id);
        }
      }

      if (memberIds.length > 0) {
        try {
          await prisma.projectMember.createMany({
            data: memberIds.map((userId) => ({
              projectId: project.id,
              userId,
            })),
            skipDuplicates: true,
          });
        } catch (memberError) {
          console.warn("Erreur membres:", memberError.message);
        }
      }
    }

    return res.status(201).json({
      success: true,
      project,
      message: "Tetikasa voaforina soa aman-tsara",
    });
  } catch (error) {
    console.error("❌ createProject error:", error);
    return res.status(500).json({
      success: false,
      message: "Nisy zavatra tsy nety tamin'ny famoronana tetikasa.",
      error: error.message,
    });
  }
};

export const updateProject = async (req, res) => {
  try {
    const clerkId = req.userId;
    const { projectId } = req.params;

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const userId = user.id;

    const {
      description,
      name,
      status,
      start_date,
      end_date,
      progress,
      priority,
    } = req.body;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { workspace: { include: { members: true } } },
    });

    if (!project) {
      return res
        .status(404)
        .json({ message: "Tsy hita na Tsy misy io tetikasa io" });
    }

    const workspace = project.workspace;

    const isAdmin = workspace.members.some(
      (m) => m.userId === userId && m.role === "ADMIN",
    );
    const isTeamLead = project.team_lead === userId;

    if (!isAdmin && !isTeamLead) {
      return res.status(403).json({
        message: "Tsy Mety: Tsy manana alalana manova ity tetikasa ity ianao.",
      });
    }

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

    return res.json({
      project: updatedProject,
      message: "Tetikasa voavao soa aman-tsara",
    });
  } catch (error) {
    console.error("❌ updateProject error:", error);
    return res.status(500).json({
      message: error.message || "Erreur lors de la mise à jour du project",
    });
  }
};

export const addMemberToProject = async (req, res) => {
  try {
    const clerkId = req.userId;
    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const userId = user.id;

    const { projectId } = req.params;
    const { memberEmail } = req.body;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        workspace: {
          include: { members: true },
        },
        members: {
          include: { user: true },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        message: "Tsy hita na Tsy misy io tetikasa io",
      });
    }

    if (project.team_lead !== userId) {
      return res.status(403).json({
        message:
          "Tsy Mety: Ny Mpandindra ny tetikasa ihany no afaka manampy mpikambana vaovao.",
      });
    }

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

    const userToAdd = await prisma.user.findUnique({
      where: { email: memberEmail },
    });

    if (!userToAdd) {
      return res.status(404).json({
        message: "Tsy hita na Tsy misy io mpikambana io kasainao ampidirina io",
      });
    }

    const isWorkspaceMember = project.workspace.members.some(
      (member) => member.userId === userToAdd.id,
    );

    if (!isWorkspaceMember) {
      await prisma.workspaceMember.create({
        data: {
          userId: userToAdd.id,
          workspaceId: project.workspaceId,
          role: "MEMBER",
        },
      });
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: userToAdd.id,
      },
    });

    res.json({
      member,
      message: "Mpikambana tafiditra soa aman-tsara ao anaty tetikasa",
    });
  } catch (error) {
    console.error("Error adding member to project:", error);
    res.status(500).json({ message: error.code || error.message });
  }
};
