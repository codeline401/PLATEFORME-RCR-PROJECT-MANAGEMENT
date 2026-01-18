import { getAuth } from "@clerk/express";

export const protect = (req, res, next) => {
  try {
    // ✅ Clerk Express WAY
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    // ✅ On stocke le userId pour les controllers
    req.userId = userId;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
};
