import prisma from "../configs/prisma.js";

// ============================================================
// PROJECT RESOURCES SERVICE
// Gestion des ressources de projet (création, mise à jour)
// ============================================================

/**
 * Créer les ressources matérielles pour un projet
 * @param {string} projectId - ID du projet
 * @param {Array} materialResources - Liste des ressources matérielles
 */
export const createMaterialResources = async (projectId, materialResources) => {
  if (!materialResources || materialResources.length === 0) return;

  const validResources = materialResources.filter(
    (r) => r.name && r.name.trim() !== ""
  );

  if (validResources.length === 0) return;

  await prisma.materialResource.createMany({
    data: validResources.map((r) => ({
      projectId,
      name: r.name,
      needed: r.needed || 1,
      owned: r.owned || 0,
    })),
  });

  console.log(`  ✓ ${validResources.length} ressources matérielles créées`);
};

/**
 * Créer les ressources humaines pour un projet
 * @param {string} projectId - ID du projet
 * @param {Array} humanResources - Liste des ressources humaines
 */
export const createHumanResources = async (projectId, humanResources) => {
  if (!humanResources || humanResources.length === 0) return;

  const validResources = humanResources.filter(
    (r) => r.name && r.name.trim() !== ""
  );

  if (validResources.length === 0) return;

  await prisma.humanResource.createMany({
    data: validResources.map((r) => ({
      projectId,
      name: r.name,
    })),
  });

  console.log(`  ✓ ${validResources.length} ressources humaines créées`);
};

/**
 * Créer les ressources financières pour un projet
 * @param {string} projectId - ID du projet
 * @param {Object} financialResources - Ressources financières {needed, owned}
 */
export const createFinancialResources = async (projectId, financialResources) => {
  if (!financialResources) return;
  if ((financialResources.needed || 0) <= 0 && (financialResources.owned || 0) <= 0) return;

  await prisma.financialResource.create({
    data: {
      projectId,
      amount: financialResources.needed || 0,
      owned: financialResources.owned || 0,
    },
  });

  console.log(`  ✓ Ressource financière créée`);
};

/**
 * Mettre à jour les ressources matérielles d'un projet
 * @param {string} projectId - ID du projet
 * @param {Array} materialResources - Liste des ressources à mettre à jour
 */
export const updateMaterialResources = async (projectId, materialResources) => {
  if (materialResources === undefined) return;

  const validResources = materialResources.filter(
    (r) => r.name && r.name.trim() !== ""
  );

  // Get IDs of resources to keep
  const idsToKeep = validResources.filter((r) => r.id).map((r) => r.id);

  // Delete resources not in the list
  await prisma.materialResource.deleteMany({
    where: {
      projectId,
      id: { notIn: idsToKeep },
    },
  });

  // Update existing resources
  for (const mr of validResources.filter((r) => r.id)) {
    await prisma.materialResource.update({
      where: { id: mr.id },
      data: {
        name: mr.name,
        needed: mr.needed || 1,
        owned: mr.owned || 0,
      },
    });
  }

  // Create new resources (without id)
  const newResources = validResources.filter((r) => !r.id);
  if (newResources.length > 0) {
    await prisma.materialResource.createMany({
      data: newResources.map((r) => ({
        projectId,
        name: r.name,
        needed: r.needed || 1,
        owned: r.owned || 0,
      })),
    });
  }
};

/**
 * Mettre à jour les ressources humaines d'un projet
 * @param {string} projectId - ID du projet
 * @param {Array} humanResources - Liste des ressources à mettre à jour
 */
export const updateHumanResources = async (projectId, humanResources) => {
  if (humanResources === undefined) return;

  const validResources = humanResources.filter(
    (r) => r.name && r.name.trim() !== ""
  );

  // Get IDs of resources to keep
  const idsToKeep = validResources.filter((r) => r.id).map((r) => r.id);

  // Delete resources not in the list
  await prisma.humanResource.deleteMany({
    where: {
      projectId,
      id: { notIn: idsToKeep },
    },
  });

  // Update existing resources
  for (const hr of validResources.filter((r) => r.id)) {
    await prisma.humanResource.update({
      where: { id: hr.id },
      data: {
        name: hr.name,
        needed: hr.needed || 1,
      },
    });
  }

  // Create new resources (without id)
  const newResources = validResources.filter((r) => !r.id);
  if (newResources.length > 0) {
    await prisma.humanResource.createMany({
      data: newResources.map((r) => ({
        projectId,
        name: r.name,
        needed: r.needed || 1,
      })),
    });
  }
};

/**
 * Mettre à jour les ressources financières d'un projet
 * @param {string} projectId - ID du projet
 * @param {Array} financialResources - Liste des ressources financières
 */
export const updateFinancialResources = async (projectId, financialResources) => {
  if (financialResources === undefined) return;

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
};

/**
 * Inclure les relations de projet standard pour les requêtes
 */
export const projectIncludeRelations = {
  members: { include: { user: true } },
  materialResources: true,
  humanResources: {
    include: {
      participants: {
        include: {
          participant: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
    },
  },
  financialResources: true,
  objectives: {
    orderBy: { order: "asc" },
    include: { indicators: true },
  },
};

/**
 * Inclure les relations publiques de projet (avec workspace)
 */
export const projectPublicIncludeRelations = {
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
  humanResources: {
    include: {
      participants: {
        include: {
          participant: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
    },
  },
  financialResources: true,
  objectives: {
    orderBy: { order: "asc" },
    include: { indicators: true },
  },
};
