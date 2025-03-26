import Joi from "joi";

export const createUserValidator = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().max(255).required(),
  password: Joi.string()
    .min(8)
    .max(20)
    .pattern(/[A-Z]/)
    .pattern(/[a-z]/)
    .pattern(/[0-9]/)
    .pattern(/[\W_]/)
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters long.",
      "string.max": "Password must be no longer than 50 characters.",
      "string.pattern.base":
        "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character (!@#$%^&*).",
      "any.required": "Password is required.",
    }),
});

export const updateUserValidator = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().max(255).required(),
});



