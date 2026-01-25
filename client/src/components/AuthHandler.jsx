// src/components/AuthHandler.jsx
import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

const AuthHandler = () => {
  const { isSignedIn, getToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handlePostLogin = async () => {
      if (!isSignedIn) return;

      try {
        // const token = await getToken();
        const currentPath = window.location.pathname;

        // Éviter la boucle infinie
        if (
          currentPath === "/create-workspace" ||
          currentPath.startsWith("/workspace/") ||
          currentPath === "/dashboard"
        ) {
          return;
        }

        console.log("🔄 AuthHandler - Vérification post-login...");

        // Attendre un peu
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Logique SIMPLIFIÉE
        console.log("➡️ Redirection vers dashboard (test)");
        navigate("/dashboard");
      } catch (error) {
        console.error("❌ AuthHandler error:", error);
        navigate("/dashboard");
      }
    };

    if (isSignedIn) {
      handlePostLogin();
    }
  }, [isSignedIn, getToken, navigate]);

  return null; // Ce composant ne rend rien
};

export default AuthHandler;
