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
                materialResources: true,
                humanResources: {
                  include: {
                    participants: {
                      include: {
                        participant: {
                          select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
                          },
                        },
                      },
                    },
                  },
                },
                financialResources: true,
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
