import { badRequest } from '../utils/appError.js';

export function validate(schema, target = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const fields = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || target;
        if (!fields[key]) fields[key] = issue.message;
      }
      return next(badRequest('Some fields need attention', fields));
    }

    if (target === 'body') req.body = result.data;
    else req[target] = result.data;
    return next();
  };
}
