
import { HTTP_CODE, RESPONSE_STATUS } from "../../common/constants.js";
import Task from "../../models/taskModel.js";
import logger from "../../common/logger.js";
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns';

export const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user._id;
        const isAdmin = req.user.role?.name === 'admin' || req.user.role?.name === 'manager';

        // Base query - if admin, show all, else show assigned tasks
        const baseQuery = { deletedAt: null };
        if (!isAdmin) {
            baseQuery.assignedTo = userId;
        }

        // 1. Task counts by status
        const statusCounts = await Task.aggregate([
            { $match: baseQuery },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const statsMap = {
            todo: 0,
            'in-progress': 0,
            done: 0,
            overdue: 0
        };

        statusCounts.forEach(s => {
            if (statsMap.hasOwnProperty(s._id)) {
                statsMap[s._id] = s.count;
            }
        });

        // 2. Overdue count (Todo or In Progress and past due date)
        const overdueCount = await Task.countDocuments({
            ...baseQuery,
            status: { $ne: 'done' },
            dueDate: { $lt: new Date() }
        });
        statsMap.overdue = overdueCount;

        // 3. Weekly Productivity (Tasks completed in the current week)
        const start = startOfWeek(new Date());
        const end = endOfWeek(new Date());
        const days = eachDayOfInterval({ start, end });

        const completedTasks = await Task.aggregate([
            {
                $match: {
                    ...baseQuery,
                    status: 'done',
                    updatedAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
                    count: { $sum: 1 }
                }
            }
        ]);

        const productivityData = days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const match = completedTasks.find(t => t._id === dateStr);
            return {
                name: format(day, 'EEE'),
                tasks: match ? match.count : 0
            };
        });

        // 4. Total count
        const totalTasks = await Task.countDocuments(baseQuery);

        return res.sendResponse(
            RESPONSE_STATUS.SUCCESS,
            HTTP_CODE.OK,
            "DASHBOARD_STATS_FETCHED",
            {
                stats: [
                    { name: 'Total Tasks', value: totalTasks, color: 'bg-blue-500', status: 'all' },
                    { name: 'Completed', value: statsMap.done, color: 'bg-green-500', status: 'done' },
                    { name: 'In Progress', value: statsMap['in-progress'], color: 'bg-yellow-500', status: 'in-progress' },
                    { name: 'Overdue', value: statsMap.overdue, color: 'bg-red-500', status: 'overdue' },
                ],
                chartData: productivityData,
                pieData: [
                    { name: 'Done', value: statsMap.done, color: '#10b981' },
                    { name: 'In Progress', value: statsMap['in-progress'], color: '#f59e0b' },
                    { name: 'Todo', value: statsMap.todo, color: '#3b82f6' },
                ]
            }
        );

    } catch (error) {
        logger.error(`Error in getDashboardStats: ${error.message}`);
        return res.sendResponse(
            RESPONSE_STATUS.ERROR,
            HTTP_CODE.INTERNAL_SERVER_ERROR,
            "SOMETHING_WENT_WRONG"
        );
    }
};
