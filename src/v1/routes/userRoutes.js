
import express from "express";
import { createUser, updateUser, deleteUser, getAllUsers, getUserById } from "../controllers/userController.js";
import { authenticateToken } from "../../middlewares/authUser.js";
import { authorizeUser } from "../../middlewares/authorizeUser.js";

const router = express.Router();

// All routes are protected and require admin privileges
router.use(authenticateToken);

// Using specific paths to avoid conflicts with other routes mounted at root v1
router.post("/createUser", authorizeUser('manage_users'), createUser);
router.put("/updateUser/:id", authorizeUser('manage_users'), updateUser);
router.delete("/deleteUser/:id", authorizeUser('manage_users'), deleteUser);
router.get("/listUsers", authorizeUser('manage_users'), getAllUsers);
router.get("/getUserDetails/:id", authorizeUser('manage_users'), getUserById);

export default router;
