import { SYSTEM_PROMPT } from '../config/system-prompt.js';

export const callGrok = async (apiModel, prompt) => {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROK_API_KEY}`,
    },
    body: JSON.stringify({
      model: apiModel,
      max_tokens: 16000,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Grok error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    text: data.choices[0].message.content,
    tokensUsed: data.usage?.total_tokens ?? 0,
  };
};
