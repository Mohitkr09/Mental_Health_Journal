// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const protect = async (req, res, next) => {
  let token;

  // 1️⃣ Check Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    console.warn("⚠️ No token provided in request");
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    // 2️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3️⃣ Attach user to request, exclude password
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      console.warn(`⚠️ User not found for token: ${decoded.id}`);
      return res.status(401).json({ message: "Not authorized, user not found" });
    }

    req.user = user;
    next(); // ✅ Proceed to controller
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};
