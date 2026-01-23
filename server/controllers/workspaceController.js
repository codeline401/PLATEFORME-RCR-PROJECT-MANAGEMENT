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
        message: "Utilisateur introuvable",
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
        message: "Seul un ADMIN peut ajouter des membres",
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
      message: "Membre ajouté avec succès",
    });
  } catch (error) {
    console.error("❌ addWorkspaceMember error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// ✅ Invite member to workspace (appelé depuis le frontend)
export const inviteWorkspaceMember = async (req, res) => {
  try {
    const userId = req.userId; // Utilisateur qui invite (from auth middleware)
    const { workspaceId } = req.params; // ID du workspace dans l'URL
    const { email, role } = req.body; // Email et rôle du nouvel utilisateur

    console.log("📝 STEP 1: Invitation membre");
    console.log(`  userId: ${userId}`);
    console.log(`  workspaceId: ${workspaceId}`);
    console.log(`  email: ${email}`);
    console.log(`  role: ${role}`);

    // FIX: Validation des champs obligatoires
    if (!email || !role || !workspaceId) {
      console.log("❌ Champs manquants");
      return res.status(400).json({
        message: "Email, rôle et workspaceId sont obligatoires",
      });
    }

    // FIX: Vérifier que le workspace existe
    console.log("📝 STEP 2: Vérification du workspace");
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    });

    if (!workspace) {
      console.log(`❌ Workspace ${workspaceId} non trouvé`);
      return res.status(404).json({
        message: "Workspace non trouvé",
      });
    }
    console.log(`  ✓ Workspace trouvé: ${workspace.name}`);

    // FIX: Vérifier les permissions (l'utilisateur doit être ADMIN)
    console.log("📝 STEP 3: Vérification des permissions");
    const isAdmin = workspace.members.some(
      (m) => m.userId === userId && m.role === "ADMIN",
    );

    if (!isAdmin) {
      console.log(`❌ Utilisateur ${userId} n'est pas ADMIN`);
      return res.status(403).json({
        message: "Seul un ADMIN peut inviter des membres",
      });
    }
    console.log("  ✓ Utilisateur est ADMIN");

    // FIX: Trouver l'utilisateur par email
    console.log("📝 STEP 4: Recherche de l'utilisateur à inviter");
    let userToInvite = await prisma.user.findUnique({
      where: { email },
    });

    // 🔧 Si l'utilisateur n'existe pas, on essaie de le créer avec un ID temporaire
    if (!userToInvite) {
      console.log(`⚠️ Utilisateur ${email} n'existe pas, création temporaire`);
      return res.status(404).json({
        message:
          "Utilisateur non trouvé avec cet email. L'utilisateur doit se connecter à Clerk au moins une fois.",
      });
    }
    console.log(`  ✓ Utilisateur trouvé: ${userToInvite.id}`);

    // FIX: Vérifier s'il est déjà membre
    console.log("📝 STEP 5: Vérification si déjà membre");
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: userToInvite.id,
      },
    });

    if (existingMember) {
      console.log(`⚠️ ${email} est déjà membre`);
      return res.status(400).json({
        message: "Cet utilisateur est déjà membre du workspace",
      });
    }

    // FIX: Ajouter le nouveau membre
    console.log("📝 STEP 6: Création du membership");
    const newMember = await prisma.workspaceMember.create({
      data: {
        userId: userToInvite.id,
        workspaceId,
        role: role || "MEMBER",
      },
      include: { user: true },
    });

    console.log(`  ✓ Membre ajouté: ${newMember.user.email}`);

    return res.status(201).json({
      success: true,
      member: newMember,
      message: "Invitation envoyée avec succès",
    });
  } catch (error) {
    console.error("❌ ERREUR inviteWorkspaceMember:", error.message);
    return res.status(500).json({
      message: error.message || "Erreur lors de l'invitation",
    });
  }
};
