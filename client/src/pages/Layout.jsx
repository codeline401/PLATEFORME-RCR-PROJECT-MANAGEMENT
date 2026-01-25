import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loadTheme } from "../features/themeSlice";
import { Loader2Icon } from "lucide-react";
import { useUser, SignIn, useAuth } from "@clerk/clerk-react";
import { fetchWorkspaces } from "../features/workspaceSlice";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasCheckedRedirect, setHasCheckedRedirect] = useState(false);
  // const [showCreateOrg, setShowCreateOrg] = useState(false);

  const { loading, workspaces, error } = useSelector(
    (state) => state.workspace,
  );
  const dispatch = useDispatch();

  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  // Chargement du thème
  useEffect(() => {
    dispatch(loadTheme());
  }, [dispatch]);

  // Chargement des workspaces
  useEffect(() => {
    const loadWorkspaces = async () => {
      if (!isLoaded || !user) return;

      try {
        console.log("🔄 Layout - Chargement des workspaces...");
        const token = await getToken();
        if (!token) {
          console.error("❌ Pas de token disponible");
          return;
        }
        dispatch(fetchWorkspaces(token));
      } catch (error) {
        console.error("❌ Erreur chargement workspaces:", error);
      }
    };

    if (isLoaded && user) {
      loadWorkspaces();
    }
  }, [isLoaded, user, dispatch, getToken]);

  // Vérifier si redirection nécessaire
  useEffect(() => {
    if (!isLoaded || !user || hasCheckedRedirect || loading) return;

    const timer = setTimeout(() => {
      console.log("🔍 Vérification redirection:");
      console.log("  - Workspaces:", workspaces.length);
      console.log("  - Loading:", loading);
      console.log("  - Current path:", window.location.pathname);

      // Si pas de workspaces ET pas d'erreur
      if (workspaces.length === 0 && !loading) {
        const currentPath = window.location.pathname;

        // Ne PAS rediriger si déjà sur create-organization
        if (currentPath === "/create-organization") {
          console.log("✅ Déjà sur create-organization");
          return;
        }

        // Vérifier si l'utilisateur a déjà une organisation dans Clerk
        if (
          user.organizationMemberships &&
          user.organizationMemberships.length > 0
        ) {
          console.log("✅ Utilisateur a déjà des organisations Clerk");
          return;
        }

        console.log("➡️ Redirection vers /create-organization");
        setHasCheckedRedirect(true);
        window.location.href = "/create-organization";
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isLoaded, user, workspaces.length, loading, error, hasCheckedRedirect]);

  // ========== RENDU ==========

  // 1. Chargement initial Clerk
  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2Icon className="size-10 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-600">Initialisation...</p>
      </div>
    );
  }

  // 2. Utilisateur non connecté → SignIn
  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <SignIn />
      </div>
    );
  }

  // 3. En cours de chargement des workspaces
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2Icon className="size-10 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-600">Chargement de vos espaces de travail...</p>
      </div>
    );
  }

  // 4. Erreur de chargement
  if (error) {
    console.error("❌ Erreur détectée:", error);
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold text-yellow-600 mb-3">
            Connexion réussie
          </h2>
          <p className="text-gray-700 mb-4">
            Vous êtes connecté mais le chargement a rencontré un problème.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Réessayer le chargement
            </button>
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
            >
              Aller au dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Pas de workspaces mais utilisateur connecté
  if (workspaces.length === 0 && user && !loading) {
    console.log("📋 Aucun workspace trouvé pour l'utilisateur");

    return (
      <div className="flex flex-col items-center justify-center h-screen p-6 bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">
            👋 Bienvenue{" "}
            {user.firstName || user.emailAddresses[0]?.emailAddress || ""} !
          </h1>

          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Vous n'avez pas encore d'espace de travail.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Les espaces de travail vous permettent de collaborer avec votre
              équipe.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => (window.location.href = "/create-organization")}
              className="w-full py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition"
            >
              Créer un espace de travail
            </button>

            <button
              onClick={() => {
                // Forcer le refresh pour recharger les workspaces
                window.location.href = "/dashboard";
              }}
              className="w-full py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Rafraîchir la page
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Vous avez été invité à un projet ? Attendez que le propriétaire
              vous ajoute à un espace de travail.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 6. Layout normal (avec workspaces)
  console.log("✅ Layout - Workspaces trouvés:", workspaces.length);

  return (
    <div className="flex bg-white dark:bg-zinc-950 min-h-screen">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div className="flex-1 flex flex-col">
        <Navbar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
