// Here we

import prisma from "../configs/prisma.js"; // Importez l'instance Prisma

export const checkProjectAccess = async (req, res, next) => {
  try {
    const userId = req.userId; // Récupérez le userId depuis le middleware d'authentification
    const { projectId } = req.params; // Récupérez le projectId depuis les paramètres de la route

    // vérifier si le project existe et si l'user à accès
    const project = await prisma.project.findUnique({
      where: { id: projectId }, // Récupérez le projet par son ID
      include: {
        // Inclure les données du workspace pour vérifier l'accès de l'utilisateur
        workspace: {
          // Inclure les données du workspace pour vérifier l'accès de l'utilisateur
          include: {
            // Inclure les membres du workspace pour vérifier l'accès de l'utilisateur
            members: true, // Inclure les membres du workspace pour vérifier l'accès de l'utilisateur
          },
        },
      },
    });

    if (!project) {
      // Si le projet n'existe pas, renvoyer une erreur 404
      return res
        .status(404)
        .json({ message: "Tsy hita io Tetikasa io na Tsy misy !!!" });
    }

    // Vérifier si le project est public
    const isWorkspacePublic = project.workspace.isPublic === "PUBLIC";
    const isProjectPublic = project.isPublic; // Vérifiez si le projet est public

    // Vérifier si l'user est membre du workspace
    const workspaceMember = project.workspace.members.find(
      (member) => member.userId === userId,
    );

    // Vérifier si l'user est est admin du workspace
    const isAdminWorkspace = workspaceMember?.role === "ADMIN";

    // Accès en lecture pour PUBLIC
    if (isWorkspacePublic && isProjectPublic && req.method === "GET") {
      req.permissions = { canRead: true, canWrite: false }; // Accès en lecture pour les projets publics
      return next(); // Passer au middleware suivant ou au controller
    }

    // Accès full pour les Admins et les membres
    if (workspaceMember) {
      req.permissions = {
        canRead: true, // Les membres peuvent lire
        canWrite: isAdminWorkspace, // Seuls les admins peuvent écrire
        role: workspaceMember.role, // Stocker le rôle de l'utilisateur pour une utilisation future
      };
      return next(); // Passer au middleware suivant ou au controller
    }

    // Accès public en lecture seule
    if (isWorkspacePublic && isProjectPublic) {
      req.permissions = { canRead: true, canWrite: false }; // Accès en lecture pour les projets publics
      return next(); // Passer au middleware suivant ou au controller
    }

    return res
      .status(403)
      .json({
        message:
          "TSY METY : Tsy manana alalana ianao ato amin'ity Tranon'asa ity",
      }); // Si l'utilisateur n'a pas accès, renvoyer une erreur 403
  } catch (error) {
    console.error("❌ Project access middleware error:", error.message);
    return res.status(500).json({ message: "Server error" }); // En cas d'erreur serveur, renvoyer une erreur 500
  }
};

export const checkWritePermissions = (req, res, next) => {
  if (!req.permissions?.canWrite) {
    // Vérifiez si l'utilisateur a les permissions d'écriture
    return res
      .status(403)
      .json({
        message: "TSY METY : ny mpandrindra ihany no afaka manova ny tetikasa",
      }); // Si l'utilisateur n'a pas les permissions d'écriture, renvoyer une erreur 403
  }
  next(); // Passer au middleware suivant ou au controller
};
