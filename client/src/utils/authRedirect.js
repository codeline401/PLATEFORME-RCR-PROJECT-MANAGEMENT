// utils/authRedirect.js
// Fonction utilitaire pour gérer la redirection après connexion

import { useAuth } from "@clerk/clerk-react";

export const redirectAfterLogin = async (token) => {
  try {
    // 1. Vérifier les workspaces
    const workspacesResponse = await fetch("/api/workspaces", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const workspacesData = await workspacesResponse.json();

    // 2. Si l'utilisateur a des workspaces → dashboard
    if (workspacesData.hasWorkspaces) {
      return "/dashboard";
    }

    // 3. Vérifier les invitations workspace
    const invitationsResponse = await fetch(
      "/api/workspaces/invitations/check",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const invitationsData = await invitationsResponse.json();

    if (
      invitationsData.hasInvitations &&
      invitationsData.invitations.length > 0
    ) {
      // Rediriger vers le premier workspace où il est invité
      const firstWorkspace = invitationsData.invitations[0].workspace;
      return `/workspace/${firstWorkspace.id}`;
    }

    // 4. Pas de workspaces, pas d'invitations → créer un workspace
    return "/create-workspace";
  } catch (error) {
    console.error("Erreur de redirection:", error);
    return "/dashboard"; // Fallback
  }
};

// Utilisation dans votre composant de connexion
export const useAuthRedirect = () => {
  const { getToken } = useAuth();

  const handlePostLogin = async () => {
    const token = await getToken();
    const redirectTo = await redirectAfterLogin(token);
    window.location.href = redirectTo;
  };

  return { handlePostLogin };
};
