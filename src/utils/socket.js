import { Server } from "socket.io";
import Redis from "ioredis";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { USER_ROLES } from "../common/constants.js";
import logger from "../common/logger.js";

let io;
let redis;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CORS_URL || "*",
            methods: ["GET", "POST"]
        }
    });

    redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

    redis.on("error", (err) => {
        logger.error("Redis Connection Error: " + err);
    });

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.token;
            if (!token) {
                return next(new Error("Authentication error: Token missing"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!decoded || !decoded.id) {
                return next(new Error("Authentication error: Invalid token"));
            }

            const user = await User.findById(decoded.id).populate('role').lean();
            if (!user) {
                return next(new Error("Authentication error: User not found"));
            }

            socket.user = user;
            next();
        } catch (err) {
            next(new Error("Authentication error: " + err.message));
        }
    });

    io.on("connection", async (socket) => {
        const userId = socket.user._id.toString();
        const roleName = socket.user.role ? socket.user.role.name : null;

        logger.info(`User connected: ${userId} (${roleName})`);

        // Store user-socket mapping in Redis
        await redis.hset("active_users", userId, socket.id);

        // Join rooms based on roles
        if (roleName === USER_ROLES.ADMIN) {
            socket.join("admins");
        } else if (roleName === USER_ROLES.MANAGER) {
            socket.join("managers");
        }

        socket.on("disconnect", async () => {
            logger.info(`User disconnected: ${userId}`);
            await redis.hdel("active_users", userId);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

export const getRedis = () => {
    if (!redis) {
        throw new Error("Redis not initialized!");
    }
    return redis;
};
