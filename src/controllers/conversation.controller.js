import { db } from '../config/firebase.js';

/**
 * Firebase path: conversations/{uid}/{convId}
 *
 * Each node stores:
 *   { id, title, model, createdAt, updatedAt, messages: [{role, text}] }
 *
 * The list endpoint strips messages for speed.
 */

const convRef = (uid, convId) =>
  db.ref(`conversations/${uid}/${convId}`);

const convListRef = (uid) =>
  db.ref(`conversations/${uid}`);

/* ── GET /api/conversations
   Returns all conversations (metadata only — no messages) sorted newest first */
export const listConversations = async (req, res, next) => {
  try {
    const snap = await convListRef(req.user.uid).once('value');
    if (!snap.exists()) return res.json({ success: true, data: [] });

    const convs = [];
    snap.forEach(child => {
      const c = child.val();
      convs.push({
        id:        c.id,
        title:     c.title,
        model:     c.model,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        // messages intentionally excluded for list performance
      });
    });

    // Newest first
    convs.sort((a, b) => b.updatedAt - a.updatedAt);

    res.json({ success: true, data: convs });
  } catch (err) {
    next(err);
  }
};

/* ── GET /api/conversations/:id
   Returns a single conversation including messages */
export const getConversation = async (req, res, next) => {
  try {
    const snap = await convRef(req.user.uid, req.params.id).once('value');
    if (!snap.exists())
      return res.status(404).json({ success: false, message: 'Conversation not found' });

    res.json({ success: true, data: snap.val() });
  } catch (err) {
    next(err);
  }
};

/* ── POST /api/conversations
   Create or update a conversation (upsert by id).
   Body: { id, title, model, messages: [{role, text}] } */
export const upsertConversation = async (req, res, next) => {
  try {
    const { id, title, model, messages } = req.body;

    if (!id || !title || !Array.isArray(messages))
      return res.status(400).json({ success: false, message: 'id, title and messages are required' });

    const now  = Date.now();
    const ref  = convRef(req.user.uid, id);
    const snap = await ref.once('value');

    const entry = {
      id,
      title:     title.slice(0, 100),
      model:     model || 'gpt-4o-mini',
      messages,
      updatedAt: now,
      createdAt: snap.exists() ? snap.val().createdAt : now,
    };

    await ref.set(entry);

    res.json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
};

/* ── DELETE /api/conversations/:id */
export const deleteConversation = async (req, res, next) => {
  try {
    await convRef(req.user.uid, req.params.id).remove();
    res.json({ success: true, message: 'Conversation deleted' });
  } catch (err) {
    next(err);
  }
};
