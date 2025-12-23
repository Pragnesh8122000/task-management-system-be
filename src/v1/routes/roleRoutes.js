import express from "express";
import { createRole, getRoles } from "../controllers/roleController.js";

const router = express.Router();

// Create role with permissions
router.post("/role", createRole);
router.get("/getRoles", getRoles);

export default router;
