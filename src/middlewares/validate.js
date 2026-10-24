// middleware to validate request bodies against Zod schemas

const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    const issues = err.issues || [];
    return res.status(400).json({
      message: issues.length
        ? issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ")
        : "Validation error",
      errors: issues,
    });
  }
};

module.exports = validate;
