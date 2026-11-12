import { asyncHandler } from '../utils/asyncHandler.js';
import { getHeatmap, getSummary } from '../services/analyticsService.js';

export const summaryHandler = asyncHandler(async (req, res) => {
  const summary = await getSummary(req.user, req.query);
  res.json({ success: true, data: summary });
});

export const heatmapHandler = asyncHandler(async (req, res) => {
  const data = await getHeatmap(req.user, req.query.days);
  res.json({ success: true, data });
});
