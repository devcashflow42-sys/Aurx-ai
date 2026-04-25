/**
 * AI Controller
 *
 * POST /api/ai/chat  — multi-model AI chat with token billing + usage log
 * GET  /api/ai/models — returns model list grouped by category (for frontend)
 */

import { db } from '../config/firebase.js';
import { callAI } from '../services/ai.service.js';
import { consumeTokens, checkDailyReset } from '../services/token.service.js';
import { getModelsByCategory, DEFAULT_MODEL } from '../config/models.js';

export const chat = async (req, res, next) => {
  try {
    const { prompt, model = DEFAULT_MODEL } = req.body;
    const uid = req.user.uid;

    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    // 1. Daily reset check (no-op if not needed)
    await checkDailyReset(uid);

    // 2. Call the AI router
    const aiResult = await callAI({ model, prompt });

    // 3. Deduct tokens (throws if insufficient)
    const tokenResult = await consumeTokens(uid, aiResult.tokensUsed);

    // 4. Write usage log to usageLogs/{uid}/{logId}
    const now    = Date.now();
    const logRef = db.ref(`usageLogs/${uid}`).push();
    await logRef.set({
      model:       aiResult.modelKey,
      provider:    aiResult.provider,
      displayName: aiResult.displayName,
      prompt,
      response:    aiResult.text,
      tokensUsed:  aiResult.tokensUsed,
      rawTokens:   aiResult.rawTokens,
      timestamp:   now,
    });

    res.status(201).json({
      success: true,
      data: {
        id: logRef.key,
        model: aiResult.modelKey,
        provider: aiResult.provider,
        displayName: aiResult.displayName,
        prompt,
        response: aiResult.text,
        tokensUsed: aiResult.tokensUsed,
        tokensRemaining: tokenResult.remaining,
        createdAt: now,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Returns all available models grouped by category.
 * Intended for a frontend model-picker / BottomSheet.
 */
export const getModels = async (_req, res, next) => {
  try {
    const categories = getModelsByCategory();
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};
