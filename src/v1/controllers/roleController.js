import { HTTP_CODE, RESPONSE_STATUS } from "../../common/constants.js";
import Role from "../../models/roleModel.js";

export const createRole = async (req, res) => {
    try {
        const { name, description, permissions } = req.body;
        if (!name || !Array.isArray(permissions) || permissions.length === 0) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.BAD_REQUEST,
                "REQUIRED_FIELDS_MISSING"
            );
        }
        const existingRole = await Role.findOne({ name });
        if (existingRole) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.BAD_REQUEST,
                "FIELD_EXISTS",
                [],
                { field: "Role" }
            );
        }
        const role = await Role.create({ name, description, permissions });
        return res.sendResponse(
            RESPONSE_STATUS.SUCCESS,
            HTTP_CODE.OK,
            "DATA_CREATED_SUCCESSFULLY",
            { role },
            { field: "Role" }
        );
    } catch (error) {
        return res.sendResponse(
            RESPONSE_STATUS.ERROR,
            HTTP_CODE.INTERNAL_SERVER_ERROR,
            "SOMETHING_WENT_WRONG"
        );
    }
};
