import { getIO } from "../../utils/socket.js";

/**
 * Emits a notification when a task is created.
 */
export const emitTaskCreated = (task, user) => {
    try {
        const io = getIO();
        io.to("users").emit("taskCreated", {
            task,
            createdBy: {
                id: user._id,
                name: user.name
            },
            timestamp: new Date()
        });
    } catch (error) {
        console.error("Socket Emission Failed:", error.message);
    }
};

/**
 * Emits a notification when a task is updated (generic).
 */
export const emitTaskUpdated = (task, user) => {
    try {
        const io = getIO();
        io.to("users").emit("taskUpdated", {
            task,
            updatedBy: {
                id: user._id,
                name: user.name
            },
            timestamp: new Date()
        });
    } catch (error) {
        console.error("Socket Emission Failed:", error.message);
    }
};

/**
 * Emits a notification when a task is deleted.
 */
export const emitTaskDeleted = (taskId, user) => {
    try {
        const io = getIO();
        io.to("users").emit("taskDeleted", {
            taskId,
            deletedBy: {
                id: user._id,
                name: user.name
            },
            timestamp: new Date()
        });
    } catch (error) {
        console.error("Socket Emission Failed:", error.message);
    }
};

/**
 * Emits a notification when a task status is updated.
 */
export const emitTaskStatusUpdate = (task, oldStatus, newStatus, user) => {
    try {
        const io = getIO();
        io.to("users").emit("taskStatusUpdated", {
            taskId: task._id,
            title: task.title,
            oldStatus,
            newStatus,
            updatedBy: {
                id: user._id,
                name: user.name
            },
            timestamp: new Date()
        });
    } catch (error) {
        console.error("Socket Emission Failed:", error.message);
    }
};
