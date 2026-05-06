import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import db from '../db.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized', data: null });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(payload.user_id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found', data: null });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token', data: null });
  }
}
