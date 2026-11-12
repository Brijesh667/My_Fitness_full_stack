import { AppError } from '../utils/appError.js';
import { isProduction } from '../config/env.js';
import { logger } from '../utils/logger.js';

export function notFoundHandler(req, res, next) {
  next(new AppError(404, 'NOT_FOUND', `No route matches ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      error: { code: err.code, message: err.message, ...(err.fields ? { fields: err.fields } : {}) }
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern ?? err.keyValue ?? {})[0] ?? 'field';
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: `${field} is already in use`,
        fields: { [field]: `${field} is already in use` }
      }
    });
  }

  if (err.name === 'ValidationError') {
    const fields = {};
    for (const [key, value] of Object.entries(err.errors ?? {})) {
      fields[key] = value.message;
    }
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Some fields need attention', fields }
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: `Invalid value for ${err.path}` }
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' }
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Request body is not valid JSON' }
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_FILE', message: 'Image must be 2 MB or smaller' }
    });
  }

  logger.error({ err, path: req.originalUrl, method: req.method }, 'unhandled request error');

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProduction ? 'Something went wrong' : err.message || 'Something went wrong'
    }
  });
}
