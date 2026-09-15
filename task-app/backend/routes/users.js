import { Router } from "express";
import { authorize } from "../middleware/authentication.js";
import * as userService from "../services/userService.js";

const router = Router();

/**
 * @openapi
 * /api/users/login:
 *   post:
 *     tags:
 *       - Users
 *     summary: Connexion
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginBody'
 *     responses:
 *       200:
 *         description: Jeton et utilisateur
 *       401:
 *         description: Identifiants invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const result = await userService.login(username, password);

  if (!result) {
    return res.status(401).json({
      success: false,
      errors: [
        { message: "Invalid credentials", field: "username or password" },
      ],
    });
  }

  res.json({ success: true, data: result });
});

/**
 * @openapi
 * /api/users/logout:
 *   post:
 *     tags:
 *       - Users
 *     summary: Déconnexion (révoque le jeton côté serveur)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Déconnecté
 */
router.post("/logout", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  userService.logout(token);
  res.json({ success: true, data: { message: "Logged out" } });
});

/**
 * @openapi
 * /api/users/register:
 *   post:
 *     tags:
 *       - Users
 *     summary: Inscription
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterBody'
 *     responses:
 *       200:
 *         description: Utilisateur créé
 *       400:
 *         description: Requête invalide
 *       409:
 *         description: Utilisateur déjà existant
 */
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const out = await userService.register(username, password);

  if (out.error) {
    const field = out.error.status === 400 ? "username, password" : "username";
    return res.status(out.error.status).json({
      success: false,
      errors: [{ message: out.error.message, field }],
    });
  }

  res.json({ success: true, data: out.data });
});

/**
 * @openapi
 * /api/users/profile:
 *   get:
 *     tags:
 *       - Users
 *     summary: Profil utilisateur
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Utilisateur introuvable
 */
router.get("/profile", authorize, async (req, res) => {
  const data = await userService.getProfile(req.userId);
  if (!data) {
    return res.status(404).json({
      success: false,
      errors: [{ message: "User not found", field: "userId" }],
    });
  }
  res.json({ success: true, data });
});

export default router;
