import http from "http";
import dotenv from "dotenv";
import server from "./server.js";
import { initSocket } from "./utils/socket.js";

dotenv.config({
    path: ".env",
});
const port = process.env.PORT || 9001;

/**
 * Starts the server and listens on the specified port.
 *
 * @async
 * @function startServer
 * @returns {Promise<void>} - Returns nothing.
 */

const startServer = async () => {
    try {
        const app = await server();
        const httpServer = http.createServer(app);

        // Initialize Socket.io
        initSocket(httpServer);

        httpServer.listen(port, () => {
            console.log("Server is running on port " + port);
            console.log("Socket.io initialized");
        });
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

startServer();