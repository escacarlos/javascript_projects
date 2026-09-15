import { Router } from "express";
import * as listService from "../services/listService.js";

const router = Router();

function listErrorBody(error) {
  const message = error.message;
  let field = "body";
  if (message.includes("list ID") || message.includes("List not found"))
    field = "listId";
  else if (message.includes("boardId")) field = "boardId";
  else if (message.includes("Order") || message.includes("order"))
    field = "order";
  else if (message.includes("name")) field = "name";
  return { success: false, errors: [{ message, field }] };
}

/**
 * @openapi
 * /api/lists/board/{boardId}:
 *   get:
 *     tags:
 *       - Lists
 *     summary: Lister les listes d'un tableau
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
 *         description: Liste des listes
 *       401:
 *         description: Non autorisé
 */
router.get("/board/:boardId", async (req, res) => {
  const { boardId } = req.params;
  const data = await listService.listListsForBoard(req.userId, boardId);
  res.json({ success: true, data });
});

/**
 * @openapi
 * /api/lists/{listId}:
 *   get:
 *     tags:
 *       - Lists
 *     summary: Détail d'une liste
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: listId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Introuvable
 */
router.get("/:listId", async (req, res) => {
  const { listId } = req.params;
  const list = await listService.getList(req.userId, listId);

  if (!list) {
    return res.status(404).json({
      success: false,
      errors: [{ message: "List not found or unauthorized", field: "listId" }],
    });
  }

  res.json({ success: true, data: list });
});

/**
 * @openapi
 * /api/lists:
 *   post:
 *     tags:
 *       - Lists
 *     summary: Créer une liste
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ListCreate'
 *     responses:
 *       201:
 *         description: Liste créée
 *       400:
 *         description: Validation échouée
 *       401:
 *         description: Non autorisé
 */
router.post("/", async (req, res) => {
  const out = await listService.createList(req.userId, req.body);

  if (out.error) {
    return res.status(out.error.status).json(listErrorBody(out.error));
  }

  res.status(201).json({ success: true, data: out.list });
});

/**
 * @openapi
 * /api/lists/{listId}:
 *   put:
 *     tags:
 *       - Lists
 *     summary: Mettre à jour une liste
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: listId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ListUpdate'
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
router.put("/:listId", async (req, res) => {
  const { listId } = req.params;
  const out = await listService.updateList(req.userId, listId, req.body);

  if (out.error) {
    return res.status(out.error.status).json(listErrorBody(out.error));
  }

  res.json({ success: true, data: out.list });
});

/**
 * @openapi
 * /api/lists/{listId}:
 *   delete:
 *     tags:
 *       - Lists
 *     summary: Supprimer une liste
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: listId
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
router.delete("/:listId", async (req, res) => {
  const { listId } = req.params;
  const out = await listService.deleteList(req.userId, listId);

  if (out.error) {
    return res.status(out.error.status).json(listErrorBody(out.error));
  }

  res.status(204).send();
});

export default router;
