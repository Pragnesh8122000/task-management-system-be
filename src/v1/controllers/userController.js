
import { HTTP_CODE, RESPONSE_STATUS } from "../../common/constants.js";
import User from "../../models/userModel.js";
import { performModelQuery } from "../../utils/common.js";
import { createUserValidation, updateUserValidation, userIdValidation } from "../validators/userValidation.js";

// Create User
export const createUser = async (req, res) => {
    try {
        const { error } = createUserValidation.validate(req.body);
        if (error) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.BAD_REQUEST,
                error.details[0].message
            );
        }

        const { name, email, password, phone, role } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.CONFLICT,
                "User already exists with this email"
            );
        }

        const userData = {
            name,
            email,
            password,
            phone,
            role,
            status: true
        };

        const user = await performModelQuery("User", "create", { data: userData });

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        return res.sendResponse(
            RESPONSE_STATUS.SUCCESS,
            HTTP_CODE.CREATED,
            "User created successfully",
            { user: userResponse },
            { field: "User" }
        );
    } catch (error) {
        return res.sendResponse(
            RESPONSE_STATUS.ERROR,
            HTTP_CODE.INTERNAL_SERVER_ERROR,
            error.message || "Something went wrong"
        );
    }
};

// Update User
export const updateUser = async (req, res) => {
    try {
        const { error: paramError } = userIdValidation.validate(req.params);
        if (paramError) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.BAD_REQUEST,
                paramError.details[0].message
            );
        }

        const { error: bodyError } = updateUserValidation.validate(req.body);
        if (bodyError) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.BAD_REQUEST,
                bodyError.details[0].message
            );
        }

        const { id } = req.params;
        const { name, email, password, phone, role } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (password) updateData.password = password; // Will be hashed by pre-save or setter if implemented, setter is used in model
        if (phone) updateData.phone = phone;
        if (role) updateData.role = role;
        // Status update removed as per requirement

        const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select("-password").populate("role", "name");

        if (!user) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.NOT_FOUND,
                "User not found"
            );
        }

        return res.sendResponse(
            RESPONSE_STATUS.SUCCESS,
            HTTP_CODE.OK,
            "User updated successfully",
            { user },
            { field: "User" }
        );
    } catch (error) {
        return res.sendResponse(
            RESPONSE_STATUS.ERROR,
            HTTP_CODE.INTERNAL_SERVER_ERROR,
            error.message || "Something went wrong"
        );
    }
};

// Delete User (Soft Delete)
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });

        if (!user) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.NOT_FOUND,
                "User not found"
            );
        }

        return res.sendResponse(
            RESPONSE_STATUS.SUCCESS,
            HTTP_CODE.OK,
            "User deleted successfully"
        );
    } catch (error) {
        return res.sendResponse(
            RESPONSE_STATUS.ERROR,
            HTTP_CODE.INTERNAL_SERVER_ERROR,
            error.message || "Something went wrong"
        );
    }
};

// Get All Users (Paginated)
export const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;

        const query = { deletedAt: null };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const usersData = await performModelQuery("User", "read", {
            page: parseInt(page),
            limit: parseInt(limit),
            query,
            populate: [{ path: 'role', select: 'name' }],
            select: '-password',
            sortBy: ['createdAt:desc']
        });

        return res.sendResponse(
            RESPONSE_STATUS.SUCCESS,
            HTTP_CODE.OK,
            "DATA_FETCHED_SUCCESSFULLY",
            {
                users: usersData.result,
                pagination: {
                    totalPages: usersData.totalPages,
                    currentPage: usersData.currentPage,
                    totalCount: usersData.totalCount
                }
            },
            { field: "Users" }
        );
    } catch (error) {
        return res.sendResponse(
            RESPONSE_STATUS.ERROR,
            HTTP_CODE.INTERNAL_SERVER_ERROR,
            error.message || "Something went wrong"
        );
    }
};

// Get Single User
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select("-password").populate("role", "name");

        if (!user) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.NOT_FOUND,
                "User not found"
            );
        }

        return res.sendResponse(
            RESPONSE_STATUS.SUCCESS,
            HTTP_CODE.OK,
            "User fetched successfully",
            { user },
            { field: "User" }
        );
    } catch (error) {
        return res.sendResponse(
            RESPONSE_STATUS.ERROR,
            HTTP_CODE.INTERNAL_SERVER_ERROR,
            error.message || "Something went wrong"
        );
    }
};
