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
        // Fetch user role and permissions
        const userDoc = await User.findById(user._id).lean();
        if (!userDoc) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.UNAUTHORIZED,
                "User not found"
            );
        }
        const roleDoc = await Role.findById(userDoc.role).populate('permissions').lean();
        if (!roleDoc) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.FORBIDDEN,
                "Role not found"
            );
        }
        const userPermissions = roleDoc.permissions.map(p => p.name);
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
