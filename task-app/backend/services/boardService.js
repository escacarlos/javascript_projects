import { Board } from "../repositories/Board.js";
import { List } from "../repositories/List.js";
import { Card } from "../repositories/Card.js";
import {
  isValidObjectId,
  validateUserId,
  validateEntityObjectId,
  validateBoardName,
} from "../utils/validation.js";

export async function listBoardsForUser(userId) {
  const boards = await Board.find({ userId }).sort({ createdAt: -1 });
  return boards.map((board) => board.toJSON());
}

export async function getBoard(userId, boardId) {
  if (!isValidObjectId(boardId)) {
    return null;
  }

  const board = await Board.findOne({ _id: boardId, userId });
  return board ? board.toJSON() : null;
}

export async function createBoard(userId, { name, description }) {
  const err = validateUserId(userId) || validateBoardName(name);
  if (err) return err;

  const board = new Board({
    userId,
    name,
    description: description || "",
  });

  await board.save();
  return { board: board.toJSON() };
}

export async function updateBoard(userId, boardId, { name, description }) {
  const idErr = validateEntityObjectId(boardId, "board");
  if (idErr) return idErr;

  const userErr = validateUserId(userId);
  if (userErr) return userErr;

  const nameErr = validateBoardName(name);
  if (nameErr) return nameErr;

  const board = await Board.findOne({ _id: boardId, userId });

  if (!board) {
    return {
      error: { status: 404, message: "Board not found or unauthorized" },
    };
  }

  if (name) board.name = name;
  if (description !== undefined) board.description = description;
  board.updatedAt = new Date();

  await board.save();
  return { board: board.toJSON() };
}

export async function deleteBoard(userId, boardId) {
  const idErr = validateEntityObjectId(boardId, "board");
  if (idErr) return idErr;

  const userErr = validateUserId(userId);
  if (userErr) return userErr;

  const board = await Board.findOne({ _id: boardId, userId });

  if (!board) {
    return {
      error: { status: 404, message: "Board not found or unauthorized" },
    };
  }

  const lists = await List.find({ boardId });

  for (const list of lists) {
    await Card.deleteMany({ listId: list._id });
  }

  await List.deleteMany({ boardId });

  await Board.deleteOne({ _id: boardId });
  return { ok: true };
}
