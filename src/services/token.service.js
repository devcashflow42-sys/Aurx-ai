/**
 * Token Service
 *
 * consumeTokens  — deduct tokens after AI call
 * checkDailyReset — reset tokens every 24h (call on login or chat)
 */

import { db } from '../config/firebase.js';

const DAILY_TOKEN_ALLOWANCE = 1000; // adjust per your plan
const MS_IN_24H = 24 * 60 * 60 * 1000;

/**
 * Deducts tokens from tokenUsers/{uid}.
 * Throws if balance is insufficient.
 *
 * @param {string} uid
 * @param {number} tokensToUse
 * @returns {{ remaining: number, used: number }}
 */
export const consumeTokens = async (uid, tokensToUse) => {
  const ref = db.ref(`tokenUsers/${uid}`);
  const snap = await ref.once('value');

  if (!snap.exists()) throw new Error('Token data not found');

  const data = snap.val();

  if (data.tokens < tokensToUse) {
    throw new Error(
      `Not enough tokens. Required: ${tokensToUse}, available: ${data.tokens}`
    );
  }

  const updatedTokens = data.tokens - tokensToUse;
  const updatedUsed = (data.tokensUsed || 0) + tokensToUse;

  await ref.update({
    tokens: updatedTokens,
    tokensUsed: updatedUsed,
    updatedAt: Date.now(),
  });

  return {
    remaining: updatedTokens,
    used: updatedUsed,
  };
};

/**
 * Resets tokens to DAILY_TOKEN_ALLOWANCE if 24h have passed since lastReset.
 * Safe to call on every request — only writes when needed.
 *
 * @param {string} uid
 */
export const checkDailyReset = async (uid) => {
  const ref = db.ref(`tokenUsers/${uid}`);
  const snap = await ref.once('value');

  if (!snap.exists()) return;

  const data = snap.val();
  const now = Date.now();
  const lastReset = data.lastReset || 0;

  if (now - lastReset >= MS_IN_24H) {
    await ref.update({
      tokens: DAILY_TOKEN_ALLOWANCE,
      tokensUsed: 0,
      lastReset: now,
      updatedAt: now,
    });
  }
};
