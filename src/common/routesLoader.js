import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import logger from "./logger.js";

export const loadRoutes = async (app, basePath, versions) => {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));

    for (const version of versions) {
        const versionedPath = path.join(__dirname, "..", version, "routes");
        if (!fs.existsSync(versionedPath)) {
            logger.warn(`Version path not found: ${versionedPath}`);
            continue;
        }

        const routeFiles = fs.readdirSync(versionedPath);
        for (const file of routeFiles) {
            try {
                if (file.endsWith(".js")) {
                    const routePath = path.join(versionedPath, file);
                    const routeFile = await import(`file://${routePath}`);
                    app.use(`${basePath}/${version}`, routeFile.default);
                }
            } catch (error) {
                logger.error(
                    `Error occurred while loading routes from ${versionedPath} \n${error}`,
                );
            }
        }
    }
};