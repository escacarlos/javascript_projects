import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "6h";

const revokedTokens = new Set();

export function loginUser(user) {
  if (!user) return null;

  const userId = user._id.toString();
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return { token, user };
}

export function logoutUser(token) {
  if (token) revokedTokens.add(token);
}

/** Vérifie un JWT d’accès (HTTP ou Socket.IO). Retourne `{ userId }` ou `null`. */
export function verifyAccessToken(token) {
  if (!token || revokedTokens.has(token)) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

export function authorize(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  const auth = verifyAccessToken(token);
  if (!auth) {
    return res.status(401).json({
      success: false,
      errors: [{ message: "Unauthorized", field: "authorization" }],
    });
  }

  req.userId = auth.userId;
  next();
}
