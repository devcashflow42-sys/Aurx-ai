import { db } from '../config/firebase.js';

export const getProfile = async (req, res, next) => {
  try {
    const snap = await db.ref(`usersFirebase/${req.user.uid}`).once('value');
    if (!snap.exists())
      return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: snap.val() });
  } catch (error) {
    next(error);
  }
};

export const getControl = async (req, res, next) => {
  try {
    const snap = await db.ref(`controlUsers/${req.user.uid}`).once('value');
    if (!snap.exists())
      return res.status(404).json({ success: false, message: 'Control record not found' });
    res.json({ success: true, data: snap.val() });
  } catch (error) {
    next(error);
  }
};
