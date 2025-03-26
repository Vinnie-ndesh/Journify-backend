import jwt from "jsonwebtoken";

import User from "../models/userModel.js";
const SECRET_KEY = process.env.SECRET_KEY;

// Middleware to check if the user is authenticated
export const authenticate = async (req, res, next) => {
  try {

    const token =
      req.header("Authorization")?.replace("Bearer ", "") || req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, SECRET_KEY);

    req.currentUser = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// Middleware to check user roles ( viewer, editor, admin)
export const authorize = (roles = [], modules = []) => {
  return async (req, res, next) => {
    try {
      const currentUser = req.currentUser;

      // Check if user is logged in
      if (!currentUser) {
        return res
          .status(401)
          .json({ message: "Unauthorized: No user information found" });
      }

      // Fetch user data from the database

      const userData = await User.findOne({
        where: { userId: currentUser.id },
      });
      if (!userData) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if the user is active
      if (userData.status !== "1") {
        return res.status(403).json({ message: "Forbidden: User is inactive" });
      }

      // Check if the user has the required role or modules
      if (roles.length && !roles.includes(userData.role)) {
        return res
          .status(403)
          .json({ message: "Forbidden: Insufficient role privileges" });
      }

      return next();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};
