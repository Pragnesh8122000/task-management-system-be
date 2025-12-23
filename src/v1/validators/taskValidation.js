import Joi from "joi";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const getTasksValidation = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow('').optional()
});

export const createTaskValidation = Joi.object({
    title: Joi.string().min(3).max(100).required().messages({
        'string.empty': 'Task title is required',
        'string.min': 'Task title must be at least 3 characters',
        'string.max': 'Task title must be at most 100 characters',
    }),
    description: Joi.string().min(3).max(500).required().messages({
        'string.empty': 'Description is required',
        'string.min': 'Description must be at least 3 characters',
        'string.max': 'Description must be at most 500 characters',
    }),
    assignedTo: Joi.array().items(Joi.string().pattern(objectIdPattern)).min(1).required().messages({
        'array.min': 'At least one user must be assigned',
        'string.pattern.base': 'Assigned user must be a valid ID',
    }),
    priority: Joi.string().valid('low', 'medium', 'high').messages({
        'any.only': 'Priority must be one of: low, medium, high',
    }),
    dueDate: Joi.string().pattern(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/).allow('', null).optional().messages({
        'string.pattern.base': 'Due date must be in DD/MM/YYYY format',
    })
});

export const updateTaskValidation = Joi.object({
    title: Joi.string().min(3).max(100).optional().messages({
        'string.min': 'Task title must be at least 3 characters',
        'string.max': 'Task title must be at most 100 characters',
    }),
    description: Joi.string().max(500).optional().messages({
        'string.max': 'Description must be at most 500 characters',
    }),
    assignedTo: Joi.array().items(Joi.string().pattern(objectIdPattern)).optional().messages({
        'string.pattern.base': 'Assigned user must be a valid ID',
    }),
    status: Joi.string().valid('todo', 'in-progress', 'done').optional().messages({
        'any.only': 'Status must be one of: todo, in-progress, done',
    }),
    priority: Joi.string().valid('low', 'medium', 'high').optional().messages({
        'any.only': 'Priority must be one of: low, medium, high',
    }),
    dueDate: Joi.string().pattern(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/).allow('', null).optional().messages({
        'string.pattern.base': 'Due date must be in DD/MM/YYYY format',
    })
});

export const updateTaskStatusValidation = Joi.object({
    status: Joi.string().valid('todo', 'in-progress', 'done').required().messages({
        'any.only': 'Status must be one of: todo, in-progress, done',
        'any.required': 'Status is required'
    })
});

export const taskIdValidation = Joi.object({
    id: Joi.string().pattern(objectIdPattern).required().messages({
        'string.empty': 'Task ID is required',
        'string.pattern.base': 'Invalid Task ID',
    })
});
