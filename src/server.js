import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { sendResponse } from "./middlewares/sendResponse.js";
import { loadRoutes } from "./common/routesLoader.js";
import db from "../config/database.js";
import { loadModels } from "./models/models.js";

dotenv.config();
/**
 * Initializes and configures an Express application, setting up middleware for CORS, JSON parsing,
 * URL-encoded data, and custom response handling. Loads API routes for the specified versions
 *
 * @returns {Promise<Object>} Returns the configured Express application instance.
 */

async function server() {
    try {
        const app = express();
        app.use(
            cors({
                origin: process.env.CORS_URL || "*",
            }),
        );
        app.use(sendResponse);
        await loadModels();

        app.use(express.json({ limit: "50mb" }));
        app.use(express.urlencoded({ limit: "50mb", extended: true }));
        const WEB_ADMIN_URL = "/TMSWebservices";
        const VERSIONS = ["v1"]; // Add more versions as needed
        await loadRoutes(app, WEB_ADMIN_URL, VERSIONS);

        return app;
    } catch (error) {
        console.log(error);
    }
}

export default server;