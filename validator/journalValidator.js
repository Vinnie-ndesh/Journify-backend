import Joi from "joi";

export const createJournalValidator = Joi.object({
    title: Joi.string().min(2).max(50).required(),
    content: Joi.string().min(2).required(),
    categoryId: Joi.number().required(),
    });