import { Router } from "express";
import * as boardService from "../services/boardService.js";

const router = Router();

function boardErrorBody(error) {
  const message = error.message;
  let field = "body";
  if (message.includes("board ID") || message.includes("Board not found"))
    field = "boardId";
  else if (message.includes("Board name")) field = "name";
  return { success: false, errors: [{ message, field }] };
}

/**
 * @openapi
 * /api/boards:
 *   get:
 *     tags:
 *       - Boards
 *     summary: Lister les tableaux de l'utilisateur
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des tableaux
 *       401:
 *         description: Non autorisé
 */
router.get("/", async (req, res) => {
  const data = await boardService.listBoardsForUser(req.userId);
  res.json({ success: true, data });
});

/**
 * @openapi
 * /api/boards/{boardId}:
 *   get:
 *     tags:
 *       - Boards
 *     summary: Détail d'un tableau
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: boardId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tableau
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Introuvable ou non autorisé
 */
router.get("/:boardId", async (req, res) => {
  const { boardId } = req.params;
  const board = await boardService.getBoard(req.userId, boardId);

  if (!board) {
    return res.status(404).json({
      success: false,
      errors: [
        { message: "Board not found or unauthorized", field: "boardId" },
      ],
    });
  }

  res.json({ success: true, data: board });
});

/**
 * @openapi
 * /api/boards:
 *   post:
 *     tags:
 *       - Boards
 *     summary: Créer un tableau
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BoardCreate'
 *     responses:
 *       201:
 *         description: Tableau créé
 *       400:
 *         description: Validation échouée
 *       401:
 *         description: Non autorisé
 */
router.post("/", async (req, res) => {
  const out = await boardService.createBoard(req.userId, req.body);

  if (out.error) {
    return res.status(out.error.status).json(boardErrorBody(out.error));
  }

  res.status(201).json({ success: true, data: out.board });
});

/**
 * @openapi
 * /api/boards/{boardId}:
 *   put:
 *     tags:
 *       - Boards
 *     summary: Mettre à jour un tableau
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: boardId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BoardUpdate'
 *     responses:
 *       200:
 *         description: Mis à jour
 *       400:
 *         description: Validation ou ID invalide
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Introuvable
 */
router.put("/:boardId", async (req, res) => {
  const { boardId } = req.params;
  const out = await boardService.updateBoard(req.userId, boardId, req.body);

  if (out.error) {
    return res.status(out.error.status).json(boardErrorBody(out.error));
  }

  res.json({ success: true, data: out.board });
});

/**
 * @openapi
 * /api/boards/{boardId}:
 *   delete:
 *     tags:
 *       - Boards
 *     summary: Supprimer un tableau
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: boardId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Supprimé
 *       400:
 *         description: ID invalide
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Introuvable
 */
router.delete("/:boardId", async (req, res) => {
  const { boardId } = req.params;
  const out = await boardService.deleteBoard(req.userId, boardId);

  if (out.error) {
    return res.status(out.error.status).json(boardErrorBody(out.error));
  }

  res.status(204).send();
});

export default router;
