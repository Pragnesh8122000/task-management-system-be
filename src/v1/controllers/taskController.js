
import { HTTP_CODE, RESPONSE_STATUS } from "../../common/constants.js";
import logger from "../../common/logger.js";
import Task from "../../models/taskModel.js";
import { performModelQuery } from "../../utils/common.js";
import { createTaskValidation, updateTaskValidation, taskIdValidation, getTasksValidation, updateTaskStatusValidation } from "../validators/taskValidation.js";
import { emitTaskStatusUpdate } from "../services/taskSocketService.js";

const parseCustomDate = (dateStr) => {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
};

export const createTask = async (req, res) => {
    const session = await Task.startSession();
    session.startTransaction();
    try {
        logger.info("Starting execution of the createTask");
        const { error } = createTaskValidation.validate(req.body);
        if (error) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.BAD_REQUEST,
                error.details[0].message
            );
        }
        let { title, description, assignedTo, priority, dueDate } = req.body;
        const createdBy = req.user._id;

        const validDueDate = parseCustomDate(dueDate);

        const taskData = {
            title,
            description,
            assignedTo,
            createdBy,
            priority: priority || 'medium',
            dueDate: validDueDate,
            activityLog: [{
                action: 'Task Created',
                details: `Task created by ${req.user.name}`,
                updatedBy: createdBy
            }]
        };

        const task = await performModelQuery("Task", "create", { data: taskData, session });
        await session.commitTransaction();
        session.endSession();
        return res.sendResponse(
            RESPONSE_STATUS.SUCCESS,
            HTTP_CODE.OK,
            "DATA_CREATED_SUCCESSFULLY",
            { task },
            { field: "Task" }
        );
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.sendResponse(
            RESPONSE_STATUS.ERROR,
            HTTP_CODE.INTERNAL_SERVER_ERROR,
            "SOMETHING_WENT_WRONG"
        );
    }
};


// Get all tasks
export const getTasks = async (req, res) => {
    try {
        const { error } = getTasksValidation.validate(req.query);
        if (error) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.BAD_REQUEST,
                error.details[0].message
            );
        }

        const { page = 1, limit = 10, search = '' } = req.query;

        const query = { deletedAt: null };
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const tasksData = await performModelQuery("Task", "read", {
            page: parseInt(page),
            limit: parseInt(limit),
            query,
            populate: [
                { path: 'assignedTo', select: 'name email' },
                { path: 'createdBy', select: 'name email' }
            ],
            sortBy: ['createdAt:desc']
        });

        return res.sendResponse(
            RESPONSE_STATUS.SUCCESS,
            HTTP_CODE.OK,
            "DATA_FETCHED_SUCCESSFULLY",
            {
                tasks: tasksData.result,
                pagination: {
                    totalPages: tasksData.totalPages,
                    currentPage: tasksData.currentPage,
                    totalCount: tasksData.totalCount,
                    remainingCount: tasksData.remainingCount
                }
            },
            { field: "Tasks" }
        );
    } catch (error) {
        return res.sendResponse(
            RESPONSE_STATUS.ERROR,
            HTTP_CODE.INTERNAL_SERVER_ERROR,
            "SOMETHING_WENT_WRONG"
        );
    }
};

// Get single task by id
export const getTaskById = async (req, res) => {
    try {
        const { error } = taskIdValidation.validate(req.params);
        if (error) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.BAD_REQUEST,
                error.details[0].message
            );
        }
        const { id } = req.params;
        const task = await Task.findOne({ _id: id, deletedAt: null })
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email')
            .populate('activityLog.updatedBy', 'name email')
            .lean();
        if (!task) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.NOT_FOUND,
                "DATA_NOT_FOUND",
                [],
                { field: "Task" }
            );
        }
        return res.sendResponse(
            RESPONSE_STATUS.SUCCESS,
            HTTP_CODE.OK,
            "DATA_FETCHED_SUCCESSFULLY",
            { task },
            { field: "Task" }
        );
    } catch (error) {
        return res.sendResponse(
            RESPONSE_STATUS.ERROR,
            HTTP_CODE.INTERNAL_SERVER_ERROR,
            "SOMETHING_WENT_WRONG"
        );
    }
};

// Update task
export const updateTask = async (req, res) => {
    try {
        const { error: paramError } = taskIdValidation.validate(req.params);
        if (paramError) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.BAD_REQUEST,
                paramError.details[0].message
            );
        }

        const { error: bodyError } = updateTaskValidation.validate(req.body);
        if (bodyError) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.BAD_REQUEST,
                bodyError.details[0].message
            );
        }

        const { id } = req.params;
        const { title, description, assignedTo, status, priority, dueDate } = req.body;

        const existingTask = await Task.findOne({ _id: id, deletedAt: null });
        if (!existingTask) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.NOT_FOUND,
                "DATA_NOT_FOUND",
                [],
                { field: "Task" }
            );
        }

        const activityEntries = [];
        const updateData = { updatedBy: req.user._id };

        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (priority) updateData.priority = priority;

        if (dueDate) {
            updateData.dueDate = parseCustomDate(dueDate);
        }

        if (status && status !== existingTask.status) {
            updateData.status = status;
            activityEntries.push({
                action: 'Status Changed',
                details: `Status changed from ${existingTask.status} to ${status}`,
                updatedBy: req.user._id
            });
        }

        if (assignedTo) {
            // Simple comparison of arrays (assuming they are sorted or order doesn't matter for just "changed")
            const oldAssignees = existingTask.assignedTo.map(a => a.toString()).sort().join(',');
            const newAssignees = assignedTo.map(a => a.toString()).sort().join(',');

            if (oldAssignees !== newAssignees) {
                updateData.assignedTo = assignedTo;
                activityEntries.push({
                    action: 'Reassigned',
                    details: 'Assigned users were updated',
                    updatedBy: req.user._id
                });
            }
        }

        const task = await Task.findOneAndUpdate(
            { _id: id, deletedAt: null },
            {
                $set: updateData,
                $push: { activityLog: { $each: activityEntries } }
            },
            { new: true }
        );

        if (status && status !== existingTask.status) {
            emitTaskStatusUpdate(task, existingTask.status, status, req.user);
        }

        return res.sendResponse(
            RESPONSE_STATUS.SUCCESS,
            HTTP_CODE.OK,
            "DATA_UPDATED_SUCCESSFULLY",
            { task },
            { field: "Task" }
        );
    } catch (error) {
        return res.sendResponse(
            RESPONSE_STATUS.ERROR,
            HTTP_CODE.INTERNAL_SERVER_ERROR,
            "SOMETHING_WENT_WRONG"
        );
    }
};

// Delete task (soft delete)
export const deleteTask = async (req, res) => {
    try {
        const { error } = taskIdValidation.validate(req.params);
        if (error) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.BAD_REQUEST,
                error.details[0].message
            );
        }
        const { id } = req.params;
        const task = await Task.findOneAndUpdate(
            { _id: id, deletedAt: null },
            { $set: { deletedAt: new Date(), updatedBy: req.user._id } },
            { new: true }
        );
        if (!task) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.NOT_FOUND,
                "DATA_NOT_FOUND",
                [],
                { field: "Task" }
            );
        }
        return res.sendResponse(
            RESPONSE_STATUS.SUCCESS,
            HTTP_CODE.OK,
            "DATA_DELETED_SUCCESSFULLY",
            { task },
            { field: "Task" }
        );
    } catch (error) {
        return res.sendResponse(
            RESPONSE_STATUS.ERROR,
            HTTP_CODE.INTERNAL_SERVER_ERROR,
            error.message || "Something went wrong"
        );
    };
}

// Update only task status
export const updateTaskStatus = async (req, res) => {
    try {
        const { error: paramError } = taskIdValidation.validate(req.params);
        if (paramError) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.BAD_REQUEST,
                paramError.details[0].message
            );
        }

        const { error: bodyError } = updateTaskStatusValidation.validate(req.body);
        if (bodyError) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.BAD_REQUEST,
                bodyError.details[0].message
            );
        }

        const { id } = req.params;
        const { status } = req.body;

        const existingTask = await Task.findOne({ _id: id, deletedAt: null });
        if (!existingTask) {
            return res.sendResponse(
                RESPONSE_STATUS.ERROR,
                HTTP_CODE.NOT_FOUND,
                "DATA_NOT_FOUND",
                [],
                { field: "Task" }
            );
        }

        // if (status === existingTask.status) {
        //     return res.sendResponse(
        //         RESPONSE_STATUS.SUCCESS,
        //         HTTP_CODE.OK,
        //         "STATUS_ALREADY_SET",
        //         { task: existingTask },
        //         { field: "Task", status }
        //     );
        // }

        const task = await Task.findOneAndUpdate(
            { _id: id, deletedAt: null },
            {
                $set: { status },
                $push: {
                    activityLog: {
                        action: 'Status Updated',
                        details: `Status changed from ${existingTask.status} to ${status}`,
                        updatedBy: req.user._id
                    }
                }
            },
            { new: true }
        );

        emitTaskStatusUpdate(task, existingTask.status, status, req.user);

        return res.sendResponse(
            RESPONSE_STATUS.SUCCESS,
            HTTP_CODE.OK,
            "DATA_UPDATED_SUCCESSFULLY",
            { task },
            { field: "Task" }
        );
    } catch (error) {
        return res.sendResponse(
            RESPONSE_STATUS.ERROR,
            HTTP_CODE.INTERNAL_SERVER_ERROR,
            "SOMETHING_WENT_WRONG"
        );
    }
}
