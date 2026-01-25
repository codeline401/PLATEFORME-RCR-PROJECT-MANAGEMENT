import { getAuth } from "@clerk/express";

export const protect = (req, res, next) => {
  try {
    // 1️⃣ Récupération des infos Clerk
    const auth = getAuth(req);
    const userId = auth?.userId;

    // Debug
    console.log("🔍 Auth Middleware - userId:", userId);
    console.log("🔍 Auth Middleware - orgId:", auth?.orgId);
    console.log("🔍 Auth Middleware - sessionId:", auth?.sessionId);

    // ❌ Pas connecté
    if (!userId) {
      console.log("❌ Auth: No userId found");
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ✅ MODIFICATION IMPORTANTE : NE PAS BLOQUER si pas d'organisation
    // Laissez l'utilisateur passer, c'est le frontend qui gérera la redirection
    console.log(`✅ Auth: User ${userId} authenticated`);

    // 2️⃣ Injection dans req pour les controllers
    req.userId = userId; // clerkUserId
    req.user = {
      clerkId: userId,
      orgId: auth?.orgId,
      sessionId: auth?.sessionId,
    };

    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error.message);
    return res.status(401).json({ message: "Unauthorized" });
  }
};
