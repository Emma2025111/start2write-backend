import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const status = 400;
    const errors = err.errors.map((error) => ({
      field: error.path.join("."),
      message: error.message,
      code: error.code,
    }));
    res.status(status).json({
      success: false,
      message: "Validation failed",
      errors,
    });
    return;
  }

  const status = typeof err.status === "number" ? err.status : 500;
  res.status(status).json({
    success: false,
    message: err.message ?? "Internal server error",
  });
};

export default errorHandler;
