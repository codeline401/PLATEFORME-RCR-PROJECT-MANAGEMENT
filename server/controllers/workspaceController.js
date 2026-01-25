import prisma from "../configs/prisma.js";

// ✅ Get all workspaces for the authenticated user - MODIFIÉ
export const getUserWorkspaces = async (req, res) => {
  try {
    const clerkId = req.userId; // C'est le clerkId du middleware

    // 🆕 D'abord, trouver l'utilisateur Prisma par son clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // 1️⃣ On récupère les relations WorkspaceMember du user
    const workspaceMembers = await prisma.workspaceMember.findMany({
      where: {
        userId: user.id, // ← Utiliser l'ID Prisma, pas le clerkId
      },
      include: {
        workspace: {
          include: {
            owner: true,
            members: {
              include: {
                user: true,
              },
            },
            projects: {
              include: {
                members: {
                  include: { user: true },
                },
                tasks: {
                  include: {
                    assignee: true,
                    comments: {
                      include: { user: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // 2️⃣ On extrait uniquement les workspaces
    const workspaces = workspaceMembers.map((wm) => wm.workspace);

    return res.status(200).json({
      workspaces,
      hasWorkspaces: workspaces.length > 0,
    });
  } catch (error) {
    console.error("❌ getUserWorkspaces error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// ✅ Add member to workspace - MODIFIÉ
export const addWorkspaceMember = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const { email, role, workspaceId, message } = req.body;

    if (!email || !workspaceId || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 1️⃣ Find invited user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        message: "Mpikambana tsy hita",
      });
    }

    // 2️⃣ Check admin rights
    const adminCheck = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: currentUserId,
        role: "ADMIN",
      },
    });

    if (!adminCheck) {
      return res.status(403).json({
        message: "Ny Mpiandraikitra ihany no afaka mampiditra mpikambana",
      });
    }

    // 3️⃣ Check if already member
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: user.id,
      },
    });

    if (existingMember) {
      return res.status(400).json({
        message: "Utilisateur déjà membre",
      });
    }

    // 🆕 AJOUT: Vérifier si l'utilisateur invité a déjà un workspace
    const userHasWorkspace = await prisma.workspaceMember.findFirst({
      where: { userId: user.id },
    });

    // Si l'utilisateur n'a PAS de workspace, on lui en crée un automatiquement
    if (!userHasWorkspace) {
      await prisma.workspace.create({
        data: {
          name: `Espace de ${user.name || user.email}`,
          ownerId: user.id,
          members: {
            create: {
              userId: user.id,
              role: "ADMIN",
            },
          },
        },
      });
    }

    // 4️⃣ Create member
    const member = await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId,
        role,
        message,
      },
    });

    return res.status(201).json({
      member,
      message: "Mpikambana tafiditra soa aman-tsara",
    });
  } catch (error) {
    console.error("❌ addWorkspaceMember error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// ✅ Invite workspace member - MODIFIÉ
export const inviteWorkspaceMember = async (req, res) => {
  try {
    const currentClerkUserId = req.userId;
    const { workspaceId } = req.params;
    const { email, role } = req.body;

    if (!email || !workspaceId || !role) {
      return res.status(400).json({
        message: "Email, rôle et workspaceId sont obligatoires",
      });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace non trouvé" });
    }

    const isAdmin = workspace.members.some(
      (m) => m.user.clerkId === currentClerkUserId && m.role === "ADMIN",
    );

    if (!isAdmin) {
      return res.status(403).json({
        message: "Seul un ADMIN peut inviter",
      });
    }

    const userToInvite = await prisma.user.findUnique({
      where: { email },
    });

    if (!userToInvite || !userToInvite.clerkId) {
      return res.status(400).json({
        message:
          "L'utilisateur doit d'abord accepter l'invitation Clerk et se connecter",
      });
    }

    const alreadyMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: userToInvite.id,
      },
    });

    if (alreadyMember) {
      return res.status(400).json({
        message: "Utilisateur déjà membre du workspace",
      });
    }

    // 🆕 AJOUT: Vérifier si l'utilisateur a déjà un workspace
    const userWorkspaceCount = await prisma.workspaceMember.count({
      where: { userId: userToInvite.id },
    });

    // Si l'utilisateur n'a PAS de workspace, on lui en crée un automatiquement
    if (userWorkspaceCount === 0) {
      await prisma.workspace.create({
        data: {
          name: `Espace de ${userToInvite.name || userToInvite.email}`,
          ownerId: userToInvite.id,
          members: {
            create: {
              userId: userToInvite.id,
              role: "ADMIN",
            },
          },
        },
      });
    }

    // 6️⃣ Ajouter au workspace
    const member = await prisma.workspaceMember.create({
      data: {
        userId: userToInvite.id,
        workspaceId,
        role,
      },
    });

    return res.status(201).json({
      success: true,
      member,
      message: "Membre ajouté au workspace",
    });
  } catch (error) {
    console.error("❌ inviteWorkspaceMember:", error);
    return res.status(500).json({
      message: "Erreur serveur",
    });
  }
};

// 🆕 NOUVELLE FONCTION: Vérifier si l'utilisateur a des invitations
export const checkUserInvitations = async (req, res) => {
  try {
    const clerkId = req.userId;

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, email: true },
    });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifier s'il a des invitations (workspaces où il est membre)
    const workspaceInvitations = await prisma.workspaceMember.findMany({
      where: {
        userId: user.id,
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return res.status(200).json({
      hasInvitations: workspaceInvitations.length > 0,
      invitations: workspaceInvitations,
    });
  } catch (error) {
    console.error("❌ checkUserInvitations error:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};
