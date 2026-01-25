import { getAuth } from "@clerk/express";

export const protect = (req, res, next) => {
  try {
    // 1️⃣ Récupération des infos Clerk
    const { userId, orgId } = getAuth(req);

    // ❌ Pas connecté
    if (!userId) {
      console.log("❌ Auth: No userId found");
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ❌ Connecté MAIS aucune organisation active
    // 👉 C'est CE CAS qui déclenche "Create organization"
    if (!orgId) {
      console.log(`❌ Auth: User ${userId} has no active organization`);
      return res.status(403).json({
        message: "No active organization",
      });
    }

    console.log(`✅ Auth: User ${userId} in org ${orgId}`);

    // 2️⃣ Injection dans req pour les controllers
    req.userId = userId; // clerkUserId
    req.orgId = orgId; // clerkOrganizationId

    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error.message);
    return res.status(401).json({ message: "Unauthorized" });
  }
};
