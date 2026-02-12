// ============================================================
// PROJECT VALIDATION
// Fonctions de validation pour les projets
// ============================================================

/**
 * Valider les champs obligatoires pour la création d'un projet
 * @param {Object} body - Corps de la requête
 * @returns {{ isValid: boolean, message?: string }}
 */
export const validateCreateProjectFields = (body) => {
  const { workspaceId, name } = body;

  if (!workspaceId || !name) {
    return {
      isValid: false,
      message: "workspaceId et name sont obligatoires",
    };
  }

  return { isValid: true };
};

/**
 * Valider les informations du trésorier si des ressources financières sont fournies
 * @param {Object} financialResources - Ressources financières
 * @param {string} treasurerName - Nom du trésorier
 * @param {string} treasurerPhone - Téléphone du trésorier
 * @returns {{ isValid: boolean, message?: string }}
 */
export const validateTreasurerInfo = (financialResources, treasurerName, treasurerPhone) => {
  const normalizedName = typeof treasurerName === "string" ? treasurerName.trim() : "";
  const normalizedPhone = typeof treasurerPhone === "string" ? treasurerPhone.trim() : "";
  
  const hasFinancialResource =
    (financialResources?.needed || 0) > 0 ||
    (financialResources?.owned || 0) > 0;

  if (hasFinancialResource) {
    if (!normalizedName || !normalizedPhone) {
      return {
        isValid: false,
        message: "Ampidiro ny nomeraon-telefaona sy anaran'ny mpitahiry vola raha misy vola ilaina.",
      };
    }
  }

  return {
    isValid: true,
    normalizedTreasurerName: normalizedName,
    normalizedTreasurerPhone: normalizedPhone,
  };
};

/**
 * Valider les informations du trésorier pour une mise à jour
 * @param {Object} currentProject - Projet actuel
 * @param {Object} financialResources - Nouvelles ressources financières
 * @param {string} treasurerName - Nom du trésorier
 * @param {string} treasurerPhone - Téléphone du trésorier
 * @returns {{ isValid: boolean, message?: string, normalizedTreasurerName?: string, normalizedTreasurerPhone?: string }}
 */
export const validateTreasurerInfoForUpdate = (currentProject, financialResources, treasurerName, treasurerPhone) => {
  const normalizedName = typeof treasurerName === "string" ? treasurerName.trim() : undefined;
  const normalizedPhone = typeof treasurerPhone === "string" ? treasurerPhone.trim() : undefined;

  const financialSource =
    financialResources !== undefined
      ? financialResources
      : currentProject.financialResources;

  const hasFinancialResource =
    (financialSource?.[0]?.amount || 0) > 0 ||
    (financialSource?.[0]?.owned || 0) > 0;

  if (hasFinancialResource) {
    if (!normalizedName && !currentProject.treasurerName) {
      return {
        isValid: false,
        message: "Ampidiro ny anaran'ny mpitahiry vola raha misy vola ilaina.",
      };
    }
    if (!normalizedPhone && !currentProject.treasurerPhone) {
      return {
        isValid: false,
        message: "Ampidiro ny nomeraon-telefaona raha misy vola ilaina.",
      };
    }
  }

  return {
    isValid: true,
    normalizedTreasurerName: normalizedName,
    normalizedTreasurerPhone: normalizedPhone,
  };
};

/**
 * Vérifier si l'utilisateur est admin du workspace
 * @param {Object} workspace - Workspace avec membres
 * @param {string} userId - ID de l'utilisateur
 * @returns {boolean}
 */
export const isWorkspaceAdmin = (workspace, userId) => {
  return workspace.members.some(
    (member) => member.userId === userId && member.role === "ADMIN"
  );
};

/**
 * Vérifier si l'utilisateur est membre du workspace
 * @param {Object} workspace - Workspace avec membres
 * @param {string} userId - ID de l'utilisateur
 * @returns {boolean}
 */
export const isWorkspaceMember = (workspace, userId) => {
  return workspace.members.some((member) => member.userId === userId);
};
