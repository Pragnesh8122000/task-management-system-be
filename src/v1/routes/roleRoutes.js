import express from "express";
import { createRole } from "../controllers/roleController.js";

const router = express.Router();

// Create role with permissions
router.post("/role", createRole);

export default router;
