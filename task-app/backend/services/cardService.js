import { Card } from "../repositories/Card.js";
import {
  isValidObjectId,
  validateUserId,
  validateEntityObjectId,
  validateCardBody,
} from "../utils/validation.js";
import { List } from "../repositories/List.js";

export async function listCardsForList(userId, listId) {
  const cards = await Card.find({ listId, userId });
  return cards.map((card) => card.toJSON());
}

export async function getCard(userId, cardId) {
  if (!isValidObjectId(cardId)) {
    return null;
  }

  const card = await Card.findOne({ _id: cardId, userId });
  if (!card) return null;

  return card.toJSON();
}

export async function createCard(userId, body) {
  const err = validateUserId(userId) || validateCardBody(body, "create");
  if (err) return err;

  const { title, description, listId, dueDate, priority } = body;

  const list = await List.findOne({ _id: listId, userId });
  if (!list) {
    return { error: { status: 404, message: "listId is not found" } };
  }

  const priorityNum =
    typeof priority === "number" ? priority : Number(priority);

  const newCard = new Card({
    userId,
    title,
    description:
      typeof description === "string" ? description : String(description),
    listId,
    dueDate: new Date(dueDate),
    priority: priorityNum,
    isCompleted: false,
  });

  await newCard.save();
  return { card: newCard.toJSON() };
}

export async function updateCard(userId, cardId, body) {
  const idErr = validateEntityObjectId(cardId, "card");
  if (idErr) return idErr;

  const userErr = validateUserId(userId);
  if (userErr) return userErr;

  const bodyErr = validateCardBody(body, "update");
  if (bodyErr) return bodyErr;

  const { title, description, listId, dueDate, priority, isCompleted } = body;
  const priorityNum =
    typeof priority === "number" ? priority : Number(priority);

  const list = await List.findOne({ _id: listId, userId });
  if (!list) {
    return { error: { status: 404, message: "listId is not found" } };
  }

  const card = await Card.findOne({ _id: cardId, userId });

  if (!card) {
    return {
      error: { status: 404, message: "Card not found or unauthorized" },
    };
  }

  card.title = title;
  card.description =
    typeof description === "string" ? description : String(description);
  card.listId = listId;
  card.dueDate = new Date(dueDate);
  card.priority = priorityNum;
  if (isCompleted !== undefined) card.isCompleted = isCompleted;

  card.updatedAt = new Date();

  await card.save();
  return { card: card.toJSON() };
}

export async function deleteCard(userId, cardId) {
  const idErr = validateEntityObjectId(cardId, "card");
  if (idErr) return idErr;

  const userErr = validateUserId(userId);
  if (userErr) return userErr;

  const card = await Card.findOne({ _id: cardId, userId });

  if (!card) {
    return {
      error: { status: 404, message: "Card not found or unauthorized" },
    };
  }

  await Card.deleteOne({ _id: cardId });
  return { ok: true };
}
