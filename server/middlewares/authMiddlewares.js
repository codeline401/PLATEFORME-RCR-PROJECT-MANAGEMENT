import { getAuth } from "@clerk/express";

export const protect = (req, res, next) => {
  try {
    // FIX: Utiliser getAuth() correctement pour éviter les warnings Clerk
    const { userId } = getAuth(req);

    if (!userId) {
      console.log("❌ Auth: No userId found");
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    console.log(`✅ Auth: User ${userId} authenticated`);
    // ✅ Stocker le userId dans req pour les controllers
    req.userId = userId;

    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error.message);
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
};
