import prisma from "../configs/prisma.js";

// ✅ Get all workspaces for the authenticated user
export const getUserWorkspaces = async (req, res) => {
  try {
    const userId = req.userId; // injecté par le middleware protect

    // 1️⃣ On récupère les relations WorkspaceMember du user
    const workspaceMembers = await prisma.workspaceMember.findMany({
      where: {
        userId, // ✅ CORRECT
      },
      include: {
        workspace: {
          include: {
            owner: true, // owner du workspace
            members: {
              include: {
                user: true, // utilisateurs membres
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

    return res.status(200).json({ workspaces });
  } catch (error) {
    console.error("❌ getUserWorkspaces error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// ✅ Add member to workspace
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

// ❌ AVANT : invitation par email sans lien Clerk
// ✅ APRÈS : on autorise uniquement un utilisateur déjà créé par Clerk

export const inviteWorkspaceMember = async (req, res) => {
  try {
    const currentClerkUserId = req.userId; // clerkUserId (injecté par middleware)
    const { workspaceId } = req.params;
    const { email, role } = req.body;

    // 1️⃣ Validation
    if (!email || !workspaceId || !role) {
      return res.status(400).json({
        message: "Email, rôle et workspaceId sont obligatoires",
      });
    }

    // 2️⃣ Vérifier workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace non trouvé" });
    }

    // 3️⃣ Vérifier ADMIN
    const isAdmin = workspace.members.some(
      (m) => m.user.clerkId === currentClerkUserId && m.role === "ADMIN",
    );

    if (!isAdmin) {
      return res.status(403).json({
        message: "Seul un ADMIN peut inviter",
      });
    }

    // 4️⃣ Trouver l'utilisateur (DOIT venir de Clerk)
    const userToInvite = await prisma.user.findUnique({
      where: { email },
    });

    // ❗ IMPORTANT : l'utilisateur doit déjà s'être connecté à Clerk
    if (!userToInvite || !userToInvite.clerkId) {
      return res.status(400).json({
        message:
          "L'utilisateur doit d'abord accepter l'invitation Clerk et se connecter",
      });
    }

    // 5️⃣ Vérifier s'il est déjà membre
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
