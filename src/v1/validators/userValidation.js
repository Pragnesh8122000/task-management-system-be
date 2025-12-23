
import Joi from "joi";

export const createUserValidation = Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().required(), // Role ID
    status: Joi.boolean().default(true)
});

export const updateUserValidation = Joi.object({
    name: Joi.string().optional(),
    phone: Joi.string().optional(),
    email: Joi.string().email().optional(),
    password: Joi.string().min(6).optional().allow(''),
    role: Joi.string().optional(),
});

export const userIdValidation = Joi.object({
    id: Joi.string().required().length(24)
});
