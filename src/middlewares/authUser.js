import { HTTP_CODE, RESPONSE_STATUS } from "../common/constants.js";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        const tokenHeader = req.headers["token"];

        let token = null;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        } else if (tokenHeader) {
            token = tokenHeader;
        }

        if (!token || typeof token !== "string") {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.UNAUTHORIZED,
                "Invalid token passed"
            );
        }
        let decodedPayload;

        try {
            decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.UNAUTHORIZED,
                "Please login again"
            );
        }

        if (!decodedPayload || !decodedPayload.id) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.UNAUTHORIZED,
                "Invalid token passed"
            );
        }

        // Fetch user with role and permissions
        const user = await User.findById(decodedPayload.id)
            .populate({
                path: 'role',
                populate: { path: 'permissions' }
            })
            .lean();
        if (!user) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.UNAUTHORIZED,
                "User not found"
            );
        }
        req.user = user;
        next();

    } catch (error) {
        return res.sendResponse(
            RESPONSE_STATUS.ERROR,
            HTTP_CODE.INTERNAL_SERVER_ERROR,
            "Internal Server Error"
        );
    }
}

// export const authorizeUser = (allowedRoles = []) => {
//     return async (req, res, next) => {
//         try {
//             const user = req.user;

//             if (!user) {
//                 return res.sendResponse(
//                     RESPONSE_STATUS.ERROR,
//                     HTTP_CODE.UNAUTHORIZED,
//                     "Unauthorized access"
//                 );
//             }

//             // Check role
//             if (!allowedRoles.includes(user.role)) {
//                 return res.sendResponse(
//                     RESPONSE_STATUS.ERROR,
//                     HTTP_CODE.FORBIDDEN,
//                     "You do not have permission to perform this action"
//                 );
//             }

//             next();
//         } catch (error) {
//             return res.sendResponse(
//                 RESPONSE_STATUS.ERROR,
//                 HTTP_CODE.INTERNAL_SERVER_ERROR,
//                 "Authorization failed"
//             );
//         }
//     };
// };