import { asyncHandler } from '../utils/asyncHandler.js';
import { runAssistant } from '../services/assistantService.js';
import { getAssistantUsage, refundAssistantQuota } from '../services/assistantQuotaService.js';

const REFUNDABLE_CODES = new Set(['AI_PROVIDER_ERROR', 'AI_INVALID_OUTPUT', 'LLM_NOT_CONFIGURED']);

export const generateHandler = asyncHandler(async (req, res) => {
  try {
    const data = await runAssistant(req.user, req.body);
    res.json({ success: true, data });
  } catch (error) {
    if (REFUNDABLE_CODES.has(error.code) && req.assistantQuota?.key) {
      await refundAssistantQuota(req.assistantQuota.key).catch(() => {});
    }
    throw error;
  }
});

export const usageHandler = asyncHandler(async (req, res) => {
  const usage = await getAssistantUsage(req.user.id);
  res.json({
    success: true,
    data: {
      limit: usage.limit,
      used: usage.used,
      remaining: usage.remaining,
      resetsAt: usage.resetsAt
    }
  });
});
