/**
 * Centralized Error Handling Middleware
 * Provides uniform JSON error responses across all API endpoints
 */
const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[API Error] ${err.name || 'Error'}: ${err.message}`);
  }

  let statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'An unexpected server error occurred.';
  let errorName = err.name || 'ServerError';

  // Handle Express body-parser invalid JSON syntax
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON in request body. Please provide valid JSON.';
    errorName = 'SyntaxError';
  }

  // Mongoose bad ObjectId / CastError
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found with id: ${err.value}`;
    errorName = 'CastError';
  }

  // Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `An account with this ${field} already exists.`;
    errorName = 'DuplicateKeyError';
  }

  // Mongoose schema validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors || {})
      .map((val) => val.message)
      .join(', ');
    errorName = 'ValidationError';
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token. Please log in.';
    errorName = 'JsonWebTokenError';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again.';
    errorName = 'TokenExpiredError';
  }

  // Payload Too Large
  if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request payload exceeds maximum permitted size.';
    errorName = 'PayloadTooLarge';
  }

  // Never expose raw stack traces in production
  return res.status(statusCode).json({
    success: false,
    error: errorName,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
