import prisma from "../configs/prisma.js";

// Créer un objectif
export const createObjective = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, result, risk } = req.body;
    const userId = req.userId;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ message: "Le nom de l'objectif est requis" });
    }

    // Vérifier que le projet existe et que l'utilisateur a les droits
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { workspace: { include: { members: true } } },
    });

    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }

    // Vérifier les permissions (admin workspace ou team lead)
    const isAdmin = project.workspace.members.some(
      (m) => m.userId === userId && m.role === "admin",
    );
    const isLead = project.team_lead === userId;

    if (!isAdmin && !isLead) {
      return res
        .status(403)
        .json({
          message: "Vous n'avez pas les droits pour ajouter un objectif",
        });
    }

    // Trouver le plus grand order pour le placer à la fin
    const maxOrder = await prisma.objective.aggregate({
      where: { projectId },
      _max: { order: true },
    });

    const objective = await prisma.objective.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        result: result?.trim() || null,
        risk: risk?.trim() || null,
        projectId,
        order: (maxOrder._max.order || 0) + 1,
      },
    });

    res.status(201).json(objective);
  } catch (error) {
    console.error("Erreur création objectif:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Récupérer les objectifs d'un projet
export const getProjectObjectives = async (req, res) => {
  try {
    const { projectId } = req.params;

    const objectives = await prisma.objective.findMany({
      where: { projectId },
      orderBy: { order: "asc" },
    });

    res.json(objectives);
  } catch (error) {
    console.error("Erreur récupération objectifs:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Mettre à jour un objectif
export const updateObjective = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, result, risk, isCompleted, order } = req.body;
    const userId = req.userId;

    const objective = await prisma.objective.findUnique({
      where: { id },
      include: {
        project: { include: { workspace: { include: { members: true } } } },
      },
    });

    if (!objective) {
      return res.status(404).json({ message: "Objectif non trouvé" });
    }

    // Vérifier les permissions
    const isAdmin = objective.project.workspace.members.some(
      (m) => m.userId === userId && m.role === "admin",
    );
    const isLead = objective.project.team_lead === userId;

    if (!isAdmin && !isLead) {
      return res
        .status(403)
        .json({
          message: "Vous n'avez pas les droits pour modifier cet objectif",
        });
    }

    const updatedObjective = await prisma.objective.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && {
          description: description?.trim() || null,
        }),
        ...(result !== undefined && { result: result?.trim() || null }),
        ...(risk !== undefined && { risk: risk?.trim() || null }),
        ...(isCompleted !== undefined && { isCompleted }),
        ...(order !== undefined && { order }),
      },
    });

    res.json(updatedObjective);
  } catch (error) {
    console.error("Erreur mise à jour objectif:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Supprimer un objectif
export const deleteObjective = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const objective = await prisma.objective.findUnique({
      where: { id },
      include: {
        project: { include: { workspace: { include: { members: true } } } },
      },
    });

    if (!objective) {
      return res.status(404).json({ message: "Objectif non trouvé" });
    }

    // Vérifier les permissions
    const isAdmin = objective.project.workspace.members.some(
      (m) => m.userId === userId && m.role === "admin",
    );
    const isLead = objective.project.team_lead === userId;

    if (!isAdmin && !isLead) {
      return res
        .status(403)
        .json({
          message: "Vous n'avez pas les droits pour supprimer cet objectif",
        });
    }

    await prisma.objective.delete({
      where: { id },
    });

    res.json({ message: "Objectif supprimé" });
  } catch (error) {
    console.error("Erreur suppression objectif:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Basculer l'état d'un objectif (complété/non complété)
export const toggleObjective = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const objective = await prisma.objective.findUnique({
      where: { id },
      include: {
        project: { include: { workspace: { include: { members: true } } } },
      },
    });

    if (!objective) {
      return res.status(404).json({ message: "Objectif non trouvé" });
    }

    // Pour toggle, on vérifie juste que l'utilisateur est membre du workspace
    const isMember = objective.project.workspace.members.some(
      (m) => m.userId === userId,
    );

    if (!isMember) {
      return res
        .status(403)
        .json({ message: "Vous n'êtes pas membre de ce workspace" });
    }

    const updatedObjective = await prisma.objective.update({
      where: { id },
      data: {
        isCompleted: !objective.isCompleted,
      },
    });

    res.json(updatedObjective);
  } catch (error) {
    console.error("Erreur toggle objectif:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ========== INDICATOR FUNCTIONS ==========

// Créer un indicateur pour un objectif
export const createIndicator = async (req, res) => {
  try {
    const { objectiveId } = req.params;
    const { name, target, unit } = req.body;
    const userId = req.userId;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Le nom de l'indicateur est requis" });
    }

    // Vérifier que l'objectif existe et les permissions
    const objective = await prisma.objective.findUnique({
      where: { id: objectiveId },
      include: { project: { include: { workspace: { include: { members: true } } } } },
    });

    if (!objective) {
      return res.status(404).json({ message: "Objectif non trouvé" });
    }

    const isAdmin = objective.project.workspace.members.some(
      (m) => m.userId === userId && m.role === "admin"
    );
    const isLead = objective.project.team_lead === userId;

    if (!isAdmin && !isLead) {
      return res.status(403).json({ message: "Vous n'avez pas les droits pour ajouter un indicateur" });
    }

    const indicator = await prisma.objectiveIndicator.create({
      data: {
        name: name.trim(),
        target: parseInt(target) || 0,
        current: 0,
        unit: unit?.trim() || "",
        objectiveId,
      },
    });

    res.status(201).json(indicator);
  } catch (error) {
    console.error("Erreur création indicateur:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Mettre à jour un indicateur (principalement la valeur current)
export const updateIndicator = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, target, current, unit } = req.body;
    const userId = req.userId;

    const indicator = await prisma.objectiveIndicator.findUnique({
      where: { id },
      include: {
        objective: {
          include: { project: { include: { workspace: { include: { members: true } } } } },
        },
      },
    });

    if (!indicator) {
      return res.status(404).json({ message: "Indicateur non trouvé" });
    }

    // Vérifier qu'on est membre du workspace (tous les membres peuvent mettre à jour les valeurs)
    const isMember = indicator.objective.project.workspace.members.some(
      (m) => m.userId === userId
    );

    if (!isMember) {
      return res.status(403).json({ message: "Vous n'êtes pas membre de ce workspace" });
    }

    const updatedIndicator = await prisma.objectiveIndicator.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(target !== undefined && { target: parseInt(target) || 0 }),
        ...(current !== undefined && { current: parseInt(current) || 0 }),
        ...(unit !== undefined && { unit: unit?.trim() || "" }),
      },
    });

    res.json(updatedIndicator);
  } catch (error) {
    console.error("Erreur mise à jour indicateur:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Supprimer un indicateur
export const deleteIndicator = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const indicator = await prisma.objectiveIndicator.findUnique({
      where: { id },
      include: {
        objective: {
          include: { project: { include: { workspace: { include: { members: true } } } } },
        },
      },
    });

    if (!indicator) {
      return res.status(404).json({ message: "Indicateur non trouvé" });
    }

    const isAdmin = indicator.objective.project.workspace.members.some(
      (m) => m.userId === userId && m.role === "admin"
    );
    const isLead = indicator.objective.project.team_lead === userId;

    if (!isAdmin && !isLead) {
      return res.status(403).json({ message: "Vous n'avez pas les droits pour supprimer cet indicateur" });
    }

    await prisma.objectiveIndicator.delete({
      where: { id },
    });

    res.json({ message: "Indicateur supprimé" });
  } catch (error) {
    console.error("Erreur suppression indicateur:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
