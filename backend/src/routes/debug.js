import { Router } from 'express';

const router = Router();

router.get('/ip', (req, res) => {
  res.json({
    success: true,
    data: {
      ip: req.ip,
      xForwardedFor: req.headers['x-forwarded-for'] ?? null
    }
  });
});

export default router;
