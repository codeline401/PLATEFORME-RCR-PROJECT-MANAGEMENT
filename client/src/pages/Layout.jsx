import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loadTheme } from "../features/themeSlice";
import { Loader2Icon } from "lucide-react";
import {
  useUser,
  SignIn,
  useAuth,
  CreateOrganization,
} from "@clerk/clerk-react";
import { fetchWorkspaces } from "../features/workspaceSlice";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const hasLoadedRef = useRef(false);
  const dashboardRetryRef = useRef(0);

  const { loading, workspaces } = useSelector((state) => state.workspace);
  const dispatch = useDispatch();

  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  /**
   * 🔹 Chargement du thème (inchangé)
   */
  useEffect(() => {
    dispatch(loadTheme());
  }, [dispatch]);

  /**
   * 🔹 Chargement INITIAL des workspaces
   * IMPORTANT :
   * - on attend que Clerk soit chargé
   * - on récupère le TOKEN ici
   * - on passe le token (string) au thunk Redux
   * - on recharge SEULEMENT une fois au chargement initial
   * - on ne recharge PAS à chaque changement de pathname
   */
  useEffect(() => {
    const loadWorkspaces = async () => {
      if (!isLoaded || !user) return;

      const token = await getToken(); // 🔐 token Clerk valide
      dispatch(fetchWorkspaces(token));
      hasLoadedRef.current = true;
    };

    // Charge SEULEMENT si jamais chargé
    if (!hasLoadedRef.current && isLoaded && user) {
      loadWorkspaces();
    }
  }, [isLoaded, user, dispatch, getToken]);

  /**
   * 🔹 Utilisateur non connecté
   */
  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen bg-white dark:bg-zinc-950">
        <SignIn />
      </div>
    );
  }

  /**
   * 🔹 Loader global pendant le fetch
   */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950">
        <Loader2Icon className="size-7 text-blue-500 animate-spin" />
      </div>
    );
  }

  /**
   * 🔹 Aucun workspace → création organisation
   */
  if (user && workspaces.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-white dark:bg-zinc-950">
        <CreateOrganization />
      </div>
    );
  }

  /**
   * 🔹 Layout principal
   */
  return (
    <div className="flex bg-white dark:bg-zinc-950 text-gray-900 dark:text-slate-100">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div className="flex-1 flex flex-col h-screen">
        <Navbar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        <div className="flex-1 h-full p-6 xl:p-10 xl:px-16 overflow-y-scroll">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
