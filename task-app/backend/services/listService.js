import { List } from "../repositories/List.js";
import { Card } from "../repositories/Card.js";
import { Board } from "../repositories/Board.js";
import {
  isValidObjectId,
  validateUserId,
  validateEntityObjectId,
  validateListName,
  validateBoardIdRef,
  validateListOrder,
  parseOrderNumber,
} from "../utils/validation.js";

export async function listListsForBoard(userId, boardId) {
  const lists = await List.find({ boardId, userId });
  return lists.map((list) => list.toJSON());
}

export async function getList(userId, listId) {
  if (!isValidObjectId(listId)) {
    return null;
  }

  const list = await List.findOne({ _id: listId, userId });
  return list ? list.toJSON() : null;
}

export async function createList(userId, { name, boardId, order }) {
  const err =
    validateUserId(userId) ||
    validateListName(name, "create") ||
    validateBoardIdRef(boardId) ||
    validateListOrder(order, "create");
  if (err) return err;

  const orderNum = parseOrderNumber(order);

  const board = await Board.findOne({ _id: boardId, userId });
  if (!board) {
    return { error: { status: 404, message: "boardId is not found" } };
  }

  const newList = new List({
    userId,
    boardId,
    name,
    order: orderNum,
  });

  await newList.save();
  return { list: newList.toJSON() };
}

export async function updateList(userId, listId, { name, order }) {
  const idErr = validateEntityObjectId(listId, "list");
  if (idErr) return idErr;

  const userErr = validateUserId(userId);
  if (userErr) return userErr;

  const bodyErr =
    validateListName(name, "update") || validateListOrder(order, "update");
  if (bodyErr) return bodyErr;

  const orderNum = parseOrderNumber(order);

  const list = await List.findOne({ _id: listId, userId });

  if (!list) {
    return {
      error: { status: 404, message: "List not found or unauthorized" },
    };
  }

  list.name = name;
  list.order = orderNum;
  list.updatedAt = new Date();

  await list.save();
  return { list: list.toJSON() };
}

export async function deleteList(userId, listId) {
  const idErr = validateEntityObjectId(listId, "list");
  if (idErr) return idErr;

  const userErr = validateUserId(userId);
  if (userErr) return userErr;

  const list = await List.findOne({ _id: listId, userId });

  if (!list) {
    return {
      error: { status: 404, message: "List not found or unauthorized" },
    };
  }

  await Card.deleteMany({ listId });

  await List.deleteOne({ _id: listId });
  return { ok: true };
}
