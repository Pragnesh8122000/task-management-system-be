import express from "express";
import { createTask, getTasks, getTaskById, updateTask, deleteTask, updateTaskStatus } from "../controllers/taskController.js";
import { getDashboardStats } from "../controllers/dashboardController.js";
import { authorizeUser } from "../../middlewares/authorizeUser.js";
import { authenticateToken } from "../../middlewares/authUser.js";

const router = express.Router();

// Create a new task
router.post("/createTask", authenticateToken, authorizeUser("task_create"), createTask);

// Get all tasks
router.get("/getTasks", authenticateToken, authorizeUser("task_read"), getTasks);

// Get a single task by ID
router.get("/getTask/:id", authenticateToken, authorizeUser("task_read"), getTaskById);

// Update a task
router.put("/updateTask/:id", authenticateToken, authorizeUser("task_update"), updateTask);

// Update only task status
router.put("/updateTaskStatus/:id", authenticateToken, authorizeUser("task_change_status"), updateTaskStatus);

// Delete a task (soft delete)
router.delete("/deleteTask/:id", authenticateToken, authorizeUser("task_delete"), deleteTask);

// Dashboard routes
router.get("/dashboardStats", authenticateToken, getDashboardStats);

export default router;
