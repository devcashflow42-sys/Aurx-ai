/**
 * Centralized model registry.
 * Add new models here — no other file needs to change.
 *
 * costMultiplier: tokens charged per 1 token of actual usage.
 * e.g. 2.0 means the user is billed 2 tokens for every 1 token sent.
 *
 * Frontend model IDs (from chat-ai.js MODELS array) are mapped here
 * to the real API model strings available from each provider.
 * Future/display-only IDs fall back to the best currently available model.
 */
export const MODEL_REGISTRY = {

  // ══════════════════════════════════════════════════════════
  //  OpenAI
  // ══════════════════════════════════════════════════════════

  // Real / canonical IDs
  'gpt-4o': {
    provider: 'openai', apiModel: 'gpt-4o',
    displayName: 'GPT-4o', category: 'OpenAI', costMultiplier: 2.0,
  },
  'gpt-4o-mini': {
    provider: 'openai', apiModel: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini', category: 'OpenAI', costMultiplier: 0.5,
  },
  'gpt-3.5-turbo': {
    provider: 'openai', apiModel: 'gpt-3.5-turbo',
    displayName: 'GPT-3.5 Turbo', category: 'OpenAI', costMultiplier: 0.3,
  },

  // Frontend display IDs → mapped to best available real model
  'gpt-5':        { provider: 'openai', apiModel: 'gpt-4o',      displayName: 'GPT-5',          category: 'OpenAI', costMultiplier: 2.0 },
  'gpt-5-mini':   { provider: 'openai', apiModel: 'gpt-4o-mini', displayName: 'GPT-5 Mini',     category: 'OpenAI', costMultiplier: 0.5 },
  'gpt-51':       { provider: 'openai', apiModel: 'gpt-4o',      displayName: 'GPT-5.1',        category: 'OpenAI', costMultiplier: 2.0 },
  'gpt-52':       { provider: 'openai', apiModel: 'gpt-4o',      displayName: 'GPT-5.2',        category: 'OpenAI', costMultiplier: 2.0 },
  'gpt-52-pro':   { provider: 'openai', apiModel: 'gpt-4o',      displayName: 'GPT-5.2 Pro',    category: 'OpenAI', costMultiplier: 2.5 },
  'gpt-54':       { provider: 'openai', apiModel: 'gpt-4o',      displayName: 'GPT-5.4',        category: 'OpenAI', costMultiplier: 2.0 },
  'gpt-54-mini':  { provider: 'openai', apiModel: 'gpt-4o-mini', displayName: 'GPT-5.4 Mini',   category: 'OpenAI', costMultiplier: 0.5 },
  'gpt-54-nano':  { provider: 'openai', apiModel: 'gpt-4o-mini', displayName: 'GPT-5.4 Nano',   category: 'OpenAI', costMultiplier: 0.3 },
  'gpt-54-pro':   { provider: 'openai', apiModel: 'gpt-4o',      displayName: 'GPT-5.4 Pro',    category: 'OpenAI', costMultiplier: 2.5 },

  // ══════════════════════════════════════════════════════════
  //  Anthropic
  // ══════════════════════════════════════════════════════════

  // Real / canonical IDs
  'claude-3-5-sonnet': {
    provider: 'anthropic', apiModel: 'claude-3-5-sonnet-20241022',
    displayName: 'Claude 3.5 Sonnet', category: 'Anthropic', costMultiplier: 1.8,
  },
  'claude-3-haiku': {
    provider: 'anthropic', apiModel: 'claude-3-haiku-20240307',
    displayName: 'Claude 3 Haiku', category: 'Anthropic', costMultiplier: 0.4,
  },
  'claude-3-opus': {
    provider: 'anthropic', apiModel: 'claude-3-opus-20240229',
    displayName: 'Claude 3 Opus', category: 'Anthropic', costMultiplier: 3.0,
  },

  // Frontend display IDs → mapped to best available real model
  'claude-45-haiku':  { provider: 'anthropic', apiModel: 'claude-3-haiku-20240307',     displayName: 'Claude 4.5 Haiku',  category: 'Anthropic', costMultiplier: 0.4 },
  'claude-45-sonnet': { provider: 'anthropic', apiModel: 'claude-3-5-sonnet-20241022',  displayName: 'Claude 4.5 Sonnet', category: 'Anthropic', costMultiplier: 1.8 },
  'claude-46-sonnet': { provider: 'anthropic', apiModel: 'claude-3-5-sonnet-20241022',  displayName: 'Claude 4.6 Sonnet', category: 'Anthropic', costMultiplier: 1.8 },
  'claude-46-opus':   { provider: 'anthropic', apiModel: 'claude-3-opus-20240229',      displayName: 'Claude 4.6 Opus',   category: 'Anthropic', costMultiplier: 3.0 },
  'claude-47-opus':   { provider: 'anthropic', apiModel: 'claude-3-opus-20240229',      displayName: 'Claude 4.7 Opus',   category: 'Anthropic', costMultiplier: 3.0 },
  'claude-4-sonnet':  { provider: 'anthropic', apiModel: 'claude-3-5-sonnet-20241022',  displayName: 'Claude 4 Sonnet',   category: 'Anthropic', costMultiplier: 1.5 },

  // ══════════════════════════════════════════════════════════
  //  Google Gemini
  // ══════════════════════════════════════════════════════════

  // Real / canonical IDs
  'gemini-1.5-pro': {
    provider: 'google', apiModel: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro', category: 'Google', costMultiplier: 1.5,
  },
  'gemini-1.5-flash': {
    provider: 'google', apiModel: 'gemini-1.5-flash',
    displayName: 'Gemini 1.5 Flash', category: 'Google', costMultiplier: 0.3,
  },
  'gemini-2.0-flash': {
    provider: 'google', apiModel: 'gemini-2.0-flash',
    displayName: 'Gemini 2.0 Flash', category: 'Google', costMultiplier: 0.4,
  },

  // Frontend display IDs → mapped to best available real model
  'gemini-25-pro':  { provider: 'google', apiModel: 'gemini-1.5-pro',   displayName: 'Gemini 2.5 Pro',        category: 'Google', costMultiplier: 1.5 },
  'gemini-30-flash':{ provider: 'google', apiModel: 'gemini-2.0-flash', displayName: 'Gemini 3.0 Flash',      category: 'Google', costMultiplier: 0.4 },
  'gemini-31-fll':  { provider: 'google', apiModel: 'gemini-1.5-flash', displayName: 'Gemini 3.1 Flash Lite', category: 'Google', costMultiplier: 0.3 },
  'gemini-3-pro':   { provider: 'google', apiModel: 'gemini-1.5-pro',   displayName: 'Gemini 3 Pro',          category: 'Google', costMultiplier: 1.8 },
  'gemini-31-pro':  { provider: 'google', apiModel: 'gemini-1.5-pro',   displayName: 'Gemini 3.1 Pro',        category: 'Google', costMultiplier: 1.8 },

  // ══════════════════════════════════════════════════════════
  //  xAI / Grok
  // ══════════════════════════════════════════════════════════

  // Real / canonical IDs
  'grok-2': {
    provider: 'grok', apiModel: 'grok-2',
    displayName: 'Grok 2', category: 'xAI', costMultiplier: 1.5,
  },
  'grok-2-mini': {
    provider: 'grok', apiModel: 'grok-2-mini',
    displayName: 'Grok 2 Mini', category: 'xAI', costMultiplier: 0.6,
  },

  // Frontend display IDs → mapped to best available real model
  'grok-4':      { provider: 'grok', apiModel: 'grok-2',      displayName: 'Grok 4',       category: 'xAI', costMultiplier: 2.0 },
  'grok-41-fast':{ provider: 'grok', apiModel: 'grok-2-mini', displayName: 'Grok 4.1 Fast',category: 'xAI', costMultiplier: 0.6 },
  'grok-4-fast': { provider: 'grok', apiModel: 'grok-2-mini', displayName: 'Grok 4 Fast',  category: 'xAI', costMultiplier: 0.6 },
};

/** Default model when none is specified */
export const DEFAULT_MODEL = 'gpt-4o';

/**
 * Returns model config or throws a clean error.
 * @param {string} modelKey
 */
export const getModelConfig = (modelKey) => {
  const config = MODEL_REGISTRY[modelKey];
  if (!config) {
    const available = Object.keys(MODEL_REGISTRY).join(', ');
    throw new Error(`Unknown model "${modelKey}". Available: ${available}`);
  }
  return config;
};

/**
 * Returns models grouped by category — ready for a frontend BottomSheet.
 * Example: { OpenAI: [...], Anthropic: [...], Google: [...] }
 */
export const getModelsByCategory = () => {
  return Object.entries(MODEL_REGISTRY).reduce((acc, [key, cfg]) => {
    if (!acc[cfg.category]) acc[cfg.category] = [];
    acc[cfg.category].push({
      id: key,
      displayName: cfg.displayName,
      costMultiplier: cfg.costMultiplier,
    });
    return acc;
  }, {});
};
