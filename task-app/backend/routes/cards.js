import { Router } from "express";
import * as cardService from "../services/cardService.js";

const router = Router();

function cardErrorBody(error) {
  const message = error.message;
  let field = "body";
  if (message.includes("card ID") || message.includes("Card not found"))
    field = "cardId";
  else if (message.includes("title")) field = "title";
  else if (message.includes("dueDate")) field = "dueDate";
  else if (message.includes("listId")) field = "listId";
  else if (message.includes("priority")) field = "priority";
  return { success: false, errors: [{ message, field }] };
}

/**
 * @openapi
 * /api/cards/list/{listId}:
 *   get:
 *     tags:
 *       - Cards
 *     summary: Lister les cartes d'une liste
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
 *         description: Liste des cartes
 *       401:
 *         description: Non autorisé
 */
router.get("/list/:listId", async (req, res) => {
  const { listId } = req.params;
  const data = await cardService.listCardsForList(req.userId, listId);
  res.json({ success: true, data });
});

/**
 * @openapi
 * /api/cards/{cardId}:
 *   get:
 *     tags:
 *       - Cards
 *     summary: Détail d'une carte
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: cardId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Carte
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Introuvable
 */
router.get("/:cardId", async (req, res) => {
  const { cardId } = req.params;
  const card = await cardService.getCard(req.userId, cardId);

  if (!card) {
    return res.status(404).json({
      success: false,
      errors: [{ message: "Card not found or unauthorized", field: "cardId" }],
    });
  }

  res.json({ success: true, data: card });
});

/**
 * @openapi
 * /api/cards:
 *   post:
 *     tags:
 *       - Cards
 *     summary: Créer une carte
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CardCreate'
 *     responses:
 *       201:
 *         description: Carte créée
 *       400:
 *         description: Validation échouée
 *       401:
 *         description: Non autorisé
 */
router.post("/", async (req, res) => {
  const out = await cardService.createCard(req.userId, req.body);

  if (out.error) {
    return res.status(out.error.status).json(cardErrorBody(out.error));
  }

  res.status(201).json({ success: true, data: out.card });
});

/**
 * @openapi
 * /api/cards/{cardId}:
 *   put:
 *     tags:
 *       - Cards
 *     summary: Mettre à jour une carte
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: cardId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CardUpdate'
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
router.put("/:cardId", async (req, res) => {
  const { cardId } = req.params;
  const out = await cardService.updateCard(req.userId, cardId, req.body);

  if (out.error) {
    return res.status(out.error.status).json(cardErrorBody(out.error));
  }

  res.json({ success: true, data: out.card });
});

/**
 * @openapi
 * /api/cards/{cardId}:
 *   delete:
 *     tags:
 *       - Cards
 *     summary: Supprimer une carte
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: cardId
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
router.delete("/:cardId", async (req, res) => {
  const { cardId } = req.params;
  const out = await cardService.deleteCard(req.userId, cardId);

  if (out.error) {
    return res.status(out.error.status).json(cardErrorBody(out.error));
  }

  res.status(204).send();
});

export default router;
