import { auth } from '../config/firebase.js';

/**
 * Parse cookies from the Cookie header without needing cookie-parser.
 */
function parseCookies(cookieHeader = '') {
  return Object.fromEntries(
    cookieHeader.split(';')
      .map(c => c.trim())
      .filter(Boolean)
      .map(c => {
        const idx = c.indexOf('=');
        return [c.slice(0, idx).trim(), c.slice(idx + 1).trim()];
      })
  );
}

const protect = async (req, res, next) => {
  // Primary: httpOnly cookie (browser sends automatically, JS cannot read it)
  // Fallback: Authorization header (for direct API / tool access)
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies['aurx_token'] ||
                req.headers.authorization?.split(' ')[1];

  if (!token)
    return res.status(401).json({ success: false, message: 'No token provided' });

  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email };
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export default protect;
