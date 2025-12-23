import { HTTP_CODE, RESPONSE_STATUS } from "../common/constants.js";
import Role from "../models/roleModel.js";
import User from "../models/userModel.js";

export const authorizeUser = (permission) => async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.UNAUTHORIZED,
                "User not authenticated"
            );
        }

        // Use pre-populated role and permissions from authenticateToken
        const userPermissions = user.role?.permissions?.map(p => p.name) || [];

        // Admin bypass (optional, depending on requirements, but often useful)
        if (user.role?.name === 'admin') {
            return next();
        }

        if (!userPermissions.includes(permission)) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.FORBIDDEN,
                "You do not have permission to perform this action"
            );
        }
        next();
    } catch (error) {
        return res.sendResponse(
            RESPONSE_STATUS.ERROR,
            HTTP_CODE.INTERNAL_SERVER_ERROR,
            error.message || "Something went wrong"
        );
    }
};
