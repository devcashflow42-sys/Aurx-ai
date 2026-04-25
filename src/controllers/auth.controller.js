
import { auth, db } from '../config/firebase.js';

const FREE_TOKENS = 100000;
const DAY_MS = 24 * 60 * 60 * 1000;

/* ─── Cookie options ─────────────────────────────────────────── */
const COOKIE_OPTIONS = {
  httpOnly: true,                                        // JS cannot read this cookie
  secure: process.env.NODE_ENV === 'production',         // HTTPS only in production
  sameSite: 'strict',
  maxAge: 60 * 60 * 1000,                               // 1 hour (Firebase ID token lifetime)
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, verifyPassword } = req.body;

    if (!name || !email || !password || !verifyPassword)
      return res.status(400).json({ success: false, message: 'All fields are required' });

    if (password !== verifyPassword)
      return res.status(400).json({ success: false, message: 'Passwords do not match' });

    const { uid } = await auth.createUser({ email, password, displayName: name });
    const now = Date.now();

    await Promise.all([
      db.ref(`usersFirebase/${uid}`).set({
        userId: uid,
        name,
        gmail: email,
        dates: now,
      }),

      db.ref(`controlUsers/${uid}`).set({
        userId: uid,
        roles: 'user',
        state: 'active',
        mode: 'free',
        createdAt: now,
      }),

      db.ref(`tokenUsers/${uid}`).set({
        userId: uid,
        tokens: FREE_TOKENS,
        tokensUsed: 0,
        planLimit: FREE_TOKENS,
        lastReset: now,
        updatedAt: now,
      }),
    ]);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: { uid, name, email },
    });

  } catch (error) {
    if (error.code === 'auth/email-already-exists')
      return res.status(409).json({ success: false, message: 'Email already registered' });
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required' });

    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    const data = await response.json();

    if (!response.ok)
      return res.status(401).json({ success: false, message: data.error?.message || 'Invalid credentials' });

    const { localId: uid, idToken } = data;

    const tokenRef = db.ref(`tokenUsers/${uid}`);
    const tokenSnap = await tokenRef.once('value');

    if (tokenSnap.exists()) {
      const tokenData = tokenSnap.val();
      const now = Date.now();

      if (now - tokenData.lastReset > DAY_MS) {
        await tokenRef.update({
          tokens: tokenData.planLimit,
          tokensUsed: 0,
          lastReset: now,
          updatedAt: now,
        });
      }
    }

    const [userSnap, controlSnap, tokenSnapUpdated] = await Promise.all([
      db.ref(`usersFirebase/${uid}`).once('value'),
      db.ref(`controlUsers/${uid}`).once('value'),
      db.ref(`tokenUsers/${uid}`).once('value'),
    ]);

    // Set token as httpOnly cookie — never exposed to JavaScript
    res.cookie('aurx_token', idToken, COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      // token is intentionally NOT sent in the response body
      user: userSnap.val(),
      control: controlSnap.val(),
      tokens: tokenSnapUpdated.val(),
    });

  } catch (error) {
    next(error);
  }
};

export const logout = (req, res) => {
  res.clearCookie('aurx_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.json({ success: true, message: 'Logged out' });
};
