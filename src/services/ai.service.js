/**
 * AI Service — Model Router
 *
 * Replaces the old callAI(prompt).
 * Usage: callAI({ model, prompt })
 *
 * Returns: { text, tokensUsed, provider, modelKey }
 */

import { getModelConfig, DEFAULT_MODEL } from '../config/models.js';
import { callOpenAI } from '../providers/openai.js';
import { callClaude }  from '../providers/claude.js';
import { callGemini }  from '../providers/gemini.js';
import { callGrok }    from '../providers/grok.js';

/**
 * Provider dispatch table.
 * To add a new provider: add one entry here + create its file in /providers.
 */
const PROVIDERS = {
  openai:    callOpenAI,
  anthropic: callClaude,
  google:    callGemini,
  grok:      callGrok,
};

/**
 * @param {{ model?: string, prompt: string }} options
 * @returns {{ text: string, tokensUsed: number, provider: string, modelKey: string }}
 */
export const callAI = async ({ model = DEFAULT_MODEL, prompt }) => {
  const config = getModelConfig(model);
  const providerFn = PROVIDERS[config.provider];

  if (!providerFn) {
    throw new Error(`Provider "${config.provider}" is not yet implemented.`);
  }

  const { text, tokensUsed } = await providerFn(config.apiModel, prompt);

  // Apply cost multiplier — this is the billed amount
  const billedTokens = Math.ceil(tokensUsed * config.costMultiplier);

  return {
    text,
    tokensUsed: billedTokens,
    rawTokens: tokensUsed,
    provider: config.provider,
    modelKey: model,
    displayName: config.displayName,
  };
};
