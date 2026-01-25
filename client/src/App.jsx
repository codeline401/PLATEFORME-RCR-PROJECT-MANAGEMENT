import { Routes, Route, Navigate } from "react-router-dom";
import {
  useAuth,
  SignIn,
  SignUp,
  CreateOrganization,
} from "@clerk/clerk-react"; // 🆕 Importez CreateOrganization
import { useEffect } from "react";
import Layout from "./pages/Layout";
import { Toaster } from "react-hot-toast";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Team from "./pages/Team";
import ProjectDetails from "./pages/ProjectDetails";
import TaskDetails from "./pages/TaskDetails";

const App = () => {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  useEffect(() => {
    const handlePostLogin = async () => {
      if (!isSignedIn) return;

      try {
        const token = await getToken();
        const currentPath = window.location.pathname;

        console.log("🔐 Chemin actuel:", currentPath);

        // Si déjà sur /create-organization, ne rien faire
        if (currentPath === "/create-organization") {
          return;
        }

        // Vérifier les workspaces
        const response = await fetch("/api/workspaces", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("📊 Workspaces:", data.workspaces?.length || 0);

          // Si pas de workspaces ET pas déjà sur create-organization
          if (!data.workspaces || data.workspaces.length === 0) {
            if (currentPath !== "/create-organization") {
              console.log("➡️ Redirection vers /create-organization");
              window.location.href = "/create-organization";
            }
          }
        }
      } catch (error) {
        console.error("❌ Erreur:", error);
      }
    };

    if (isSignedIn) {
      setTimeout(() => {
        handlePostLogin();
      }, 1000);
    }
  }, [isSignedIn, getToken]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        Chargement...
      </div>
    );
  }

  return (
    <>
      <Toaster />
      <Routes>
        {/* Route racine */}
        <Route
          path="/"
          element={
            isSignedIn ? (
              <Navigate to="/dashboard" />
            ) : (
              <Navigate to="/sign-in" />
            )
          }
        />

        {/* Routes publiques avec Clerk */}
        <Route
          path="/sign-in"
          element={
            <div className="flex justify-center items-center h-screen">
              <SignIn />
            </div>
          }
        />

        <Route
          path="/sign-up"
          element={
            <div className="flex justify-center items-center h-screen">
              <SignUp />
            </div>
          }
        />

        {/* 🆕 ROUTE POUR CRÉER UNE ORGANISATION/WORKSPACE */}
        <Route
          path="/create-organization"
          element={
            <div className="flex justify-center items-center min-h-screen p-4">
              {isSignedIn ? <CreateOrganization /> : <Navigate to="/sign-in" />}
            </div>
          }
        />

        {/* Routes protégées */}
        {isSignedIn ? (
          <>
            {/* Routes dans Layout */}
            <Route path="/" element={<Layout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="team" element={<Team />} />
              <Route path="projects" element={<Projects />} />
              <Route path="projectsDetail" element={<ProjectDetails />} />
              <Route path="taskDetails" element={<TaskDetails />} />
            </Route>
          </>
        ) : (
          <Route path="*" element={<Navigate to="/sign-in" />} />
        )}
      </Routes>
    </>
  );
};

export default App;
