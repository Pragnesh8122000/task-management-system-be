
import mongoose from "mongoose";
import { HTTP_CODE, RESPONSE_STATUS, USER_ROLES } from "../../common/constants.js";
import logger from "../../common/logger.js";
import { getJWTToken, performModelQuery } from "../../utils/common.js";
import User from "../../models/userModel.js";
import Role from "../../models/roleModel.js";
import bcrypt from "bcrypt";

import { loginValidation, registerValidation } from "../validators/authValidation.js";

export const loginUser = async (req, res) => {
    try {
        logger.info("Starting execution of the loginUser");

        const { error } = loginValidation.validate(req.body);
        if (error) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.BAD_REQUEST,
                error.details[0].message
            );
        }

        const { email, password } = req.body;
        // Populate role and permissions
        const user = await User.findOne({ email })
            .populate({
                path: 'role',
                populate: { path: 'permissions' }
            })
            .lean();
        if (!user) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.BAD_REQUEST,
                "USER_NOT_FOUND",
            );
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.BAD_REQUEST,
                "INCORRECT_PASSWORD",
            );
        }

        // Prepare role and permissions for JWT and response
        const role = user.role ? {
            _id: user.role._id ? user.role._id.toString() : undefined,
            name: user.role.name,
            permissions: user.role.permissions ? user.role.permissions.map(p => p.name) : []
        } : null;

        // JWT payload should include roleId and permissions
        const tokenPayload = {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: role ? role._id : null,
            permissions: role ? role.permissions : []
        };
        const token = getJWTToken(tokenPayload);

        return res.sendResponse(
            RESPONSE_STATUS.SUCCESS,
            HTTP_CODE.OK,
            "LOGIN_SUCCESS",
            {
                token,
                userId: user._id ? user._id.toString() : undefined,
                name: user.name,
                role,
                email: user.email,
            },
        );
    } catch (error) {
        logger.error(`Error occured while running loginUser: ${error}`);
        return res.sendResponse(
            RESPONSE_STATUS.ERROR,
            HTTP_CODE.INTERNAL_SERVER_ERROR,
            "SOMETHING_WENT_WRONG"
        );
    }
}

export const getUsers = async (req, res) => {
    try {
        const users = await User.find({ deletedAt: null })
            .select("-password")
            .populate({
                path: 'role',
                populate: { path: 'permissions' }
            })
            .lean();

        const formattedUsers = users.map(user => ({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role ? {
                _id: user.role._id,
                name: user.role.name,
                permissions: user.role.permissions ? user.role.permissions.map(p => p.name) : []
            } : null
        }));

        return res.sendResponse(
            RESPONSE_STATUS.SUCCESS,
            HTTP_CODE.OK,
            "DATA_FETCHED_SUCCESSFULLY",
            { users: formattedUsers },
            { field: "Users" }
        );
    } catch (error) {
        logger.error(`Error occured while running getUsers: ${error}`);
        return res.sendResponse(
            RESPONSE_STATUS.ERROR,
            HTTP_CODE.INTERNAL_SERVER_ERROR,
            "SOMETHING_WENT_WRONG"
        );
    }
};

export const fetchProfile = async (req, res) => {
    try {
        const user = req.user;
        const roleData = user.role ? {
            _id: user.role._id.toString(),
            name: user.role.name,
            permissions: user.role.permissions ? user.role.permissions.map(p => p.name) : []
        } : null;

        return res.sendResponse(
            RESPONSE_STATUS.SUCCESS,
            HTTP_CODE.OK,
            "DATA_FETCHED_SUCCESSFULLY",
            {
                user_id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: roleData,
                permissions: roleData ? roleData.permissions : []
            },
            { field: "User" }
        );
    } catch (error) {
        logger.error(`Error occured while running fetchProfile: ${error}`);
        return res.sendResponse(
            RESPONSE_STATUS.ERROR,
            HTTP_CODE.INTERNAL_SERVER_ERROR,
            "SOMETHING_WENT_WRONG"
        );
    }
};

export const registerUser = async (req, res) => {

    const { error } = registerValidation.validate(req.body);
    if (error) {
        return res.sendResponse(
            RESPONSE_STATUS.ERROR,
            HTTP_CODE.BAD_REQUEST,
            error.details[0].message
        );
    }

    const session = await User.startSession();
    session.startTransaction();
    try {
        logger.info("Starting execution of the registerUser");
        const { email, password, name, phone } = req.body;

        const isEmailExist = await performModelQuery("User", "findOne", { query: { email } });
        if (isEmailExist) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.BAD_REQUEST,
                "FIELD_EXISTS",
                [],
                { field: "Email" }
            );
        }

        const isPhoneExist = await performModelQuery("User", "findOne", { query: { phone } });
        if (isPhoneExist) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.BAD_REQUEST,
                "FIELD_EXISTS",
                [],
                { field: "Phone" }
            );
        }

        const userRole = await Role.findOne({ name: USER_ROLES.USER });
        if (!userRole) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.INTERNAL_SERVER_ERROR,
                "DEFAULT_ROLE_NOT_FOUND"
            );
        }

        const newUser = await performModelQuery("User", "create", { data: { email, password, name, phone, role: userRole._id }, session });

        if (!newUser) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.INTERNAL_SERVER_ERROR,
                "SOMETHING_WENT_WRONG"
            );
        }

        // Fetch full user data with populated role and permissions for response
        const userDoc = await User.findById(newUser._id).populate({
            path: 'role',
            populate: { path: 'permissions' }
        }).session(session).lean();

        if (!userDoc) {
            await session.abortTransaction();
            session.endSession();
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.INTERNAL_SERVER_ERROR,
                "USER_DOCUMENT_FETCH_FAILED"
            );
        }

        const roleData = userDoc.role ? {
            _id: userDoc.role._id.toString(),
            name: userDoc.role.name,
            permissions: userDoc.role.permissions ? userDoc.role.permissions.map(p => p.name) : []
        } : null;

        await session.commitTransaction();
        session.endSession();
        return res.sendResponse(
            RESPONSE_STATUS.SUCCESS,
            HTTP_CODE.OK,
            "REGISTER_SUCCESS",
            {
                user_id: userDoc._id.toString(),
                name: userDoc.name,
                email: userDoc.email,
                role: roleData,
                permissions: roleData ? roleData.permissions : []
            }
        );

    } catch (error) {
        logger.error(`Error occured while running registerUser: ${error}`);
        await session.abortTransaction();
        session.endSession();
        return res.sendResponse(
            RESPONSE_STATUS.ERROR,
            HTTP_CODE.INTERNAL_SERVER_ERROR,
            "SOMETHING_WENT_WRONG"
        );
    }
}