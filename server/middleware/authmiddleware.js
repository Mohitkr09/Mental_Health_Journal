import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const protect = async (req, res, next) => {
  let token;

  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request (exclude password)
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }

      return next(); // proceed to controller
    }

    // No token provided
    res.status(401).json({ message: "Not authorized, no token" });
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};
