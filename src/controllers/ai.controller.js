/**
 * AI Controller
 *
 * POST /api/ai/chat  — multi-model AI chat with token billing + usage log
 * GET  /api/ai/models — returns model list grouped by category (for frontend)
 */

import { db } from '../config/firebase.js';
import { callAI } from '../services/ai.service.js';
import { consumeTokens, checkDailyReset } from '../services/token.service.js';
import { getModelsByCategory, DEFAULT_MODEL, getModelConfig } from '../config/models.js';
import { streamOpenAI } from '../providers/openai.js';
import { streamClaude }  from '../providers/claude.js';

const STREAM_FNS = {
  openai:    streamOpenAI,
  anthropic: streamClaude,
};

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
 * POST /api/ai/stream — SSE streaming chat response
 */
export const chatStream = async (req, res, next) => {
  const { prompt, model = DEFAULT_MODEL } = req.body;
  const uid = req.user.uid;

  if (!prompt) {
    return res.status(400).json({ success: false, message: 'Prompt is required' });
  }

  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  /* ── Keepalive: send SSE comment every 15 s to beat Render's 60 s proxy timeout ── */
  const keepAlive = setInterval(() => {
    if (!res.writableEnded) res.write(': ping\n\n');
  }, 15000);

  let fullText  = '';
  let rawTokens = 0;

  try {
    await checkDailyReset(uid);

    const config   = getModelConfig(model);
    const streamFn = STREAM_FNS[config.provider];

    if (streamFn) {
      /* Native streaming (OpenAI / Anthropic) */
      for await (const token of streamFn(config.apiModel, prompt)) {
        fullText += token;
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
      rawTokens = Math.ceil(fullText.length / 4); // ~4 chars/token estimate
    } else {
      /* Simulated streaming — get full response then chunk it word-by-word */
      const result = await callAI({ model, prompt });
      fullText  = result.text;
      rawTokens = result.rawTokens;
      const words = fullText.split(/(\s+)/);
      for (const w of words) {
        if (!w) continue;
        res.write(`data: ${JSON.stringify({ token: w })}\n\n`);
        await new Promise(r => setTimeout(r, 12));
      }
    }

    res.write('data: [DONE]\n\n');

    /* Log usage after stream completes */
    const billedTokens = Math.ceil(rawTokens * (getModelConfig(model).costMultiplier ?? 1));
    await consumeTokens(uid, billedTokens);

    const now    = Date.now();
    const logRef = db.ref(`usageLogs/${uid}`).push();
    await logRef.set({
      model:       model,
      provider:    getModelConfig(model).provider,
      displayName: getModelConfig(model).displayName,
      prompt,
      response:    fullText,
      tokensUsed:  billedTokens,
      rawTokens,
      timestamp:   now,
    });

    res.end();
  } catch (err) {
    if (!res.writableEnded) {
      try {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
      } catch { /* already closed */ }
    }
    if (!res.headersSent) next(err);
  } finally {
    clearInterval(keepAlive);
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
