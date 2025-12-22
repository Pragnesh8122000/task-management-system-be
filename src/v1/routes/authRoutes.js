// route file for authentication-related endpoints
import express from "express";
import { loginUser, registerUser, fetchProfile } from "../controllers/authController.js";
import { authenticateToken } from "../../middlewares/authUser.js";
const router = express.Router();

// Route for user registration
router.post("/register", registerUser);
// Route for user login
router.post("/login", loginUser);
// Route for getting authenticated user details
router.get("/fetchProfile", authenticateToken, fetchProfile);

export default router;