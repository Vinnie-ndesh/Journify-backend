


const JoiValidator = (schema) => {
  return async (req, res, next) => {
    try {
      await schema.validateAsync(req.body);
      next();
    } catch (error) {
      res.status(400).json({ message: error.details[0].message });
    }
  };
};

export default JoiValidator;
