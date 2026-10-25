/**
 * Error Handling Middleware Placeholder
 * Future purpose: Catch and format application-wide errors, returning appropriate
 * HTTP status codes and uniform JSON error responses.
 */

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = errorHandler;
