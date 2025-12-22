import { getIO } from "../../utils/socket.js";

/**
 * Emits a notification to active admins and managers when a task status is updated.
 * 
 * @param {Object} task - The updated task document.
 * @param {string} oldStatus - The status of the task before the update.
 * @param {string} newStatus - The new status of the task.
 * @param {Object} user - The user who performed the update.
 */
export const emitTaskStatusUpdate = (task, oldStatus, newStatus, user) => {
    try {
        const io = getIO();
        io.to("admins").to("managers").emit("TASK_STATUS_UPDATED", {
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
        // Log error but don't break the main request flow
        console.error("Socket Emission Failed:", error.message);
    }
};
