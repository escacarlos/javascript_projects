import mongoose from "mongoose";

export function isValidObjectId(id) {
  return Boolean(
    id && id !== "undefined" && mongoose.Types.ObjectId.isValid(id),
  );
}

export function validateUserId(userId) {
  if (!isValidObjectId(userId)) {
    return { error: { status: 400, message: "Invalid user ID" } };
  }
  return null;
}

const entityIdMessages = {
  list: "Invalid list ID",
  board: "Invalid board ID",
  card: "Invalid card ID",
};

export function validateEntityObjectId(id, entity) {
  if (!isValidObjectId(id)) {
    return { error: { status: 400, message: entityIdMessages[entity] } };
  }
  return null;
}

export function validateBoardName(name) {
  if (!name) {
    return {
      error: {
        status: 400,
        message: "Board name is a required parameter in the body.",
      },
    };
  }
  if (!(name.length > 2)) {
    return {
      error: {
        status: 400,
        message: "Board name must be at least 3 characters long.",
      },
    };
  }
  return null;
}

const listNameRequiredMessage = {
  create: "List name (at least 1 character) is required parameter.",
  update:
    "List name (at least 1 character) is a required parameter in the body.",
};

/** @param {'create' | 'update'} mode */
export function validateListName(name, mode) {
  if (!name) {
    return {
      error: {
        status: 400,
        message: listNameRequiredMessage[mode],
      },
    };
  }
  return null;
}

export function validateBoardIdRef(boardId) {
  if (!boardId) {
    return {
      error: { status: 400, message: "boardId is required parameter." },
    };
  }
  if (!isValidObjectId(boardId)) {
    return {
      error: { status: 400, message: "boardId must be a valid ObjectId." },
    };
  }
  return null;
}

const orderRequiredMessage = {
  create: "Order is required parameter.",
  update: "Order is required parameter in the body.",
};

/** @param {'create' | 'update'} mode */
export function validateListOrder(order, mode) {
  if (order === undefined || order === null) {
    return { error: { status: 400, message: orderRequiredMessage[mode] } };
  }
  const orderNum = typeof order === "number" ? order : Number(order);
  if (!Number.isFinite(orderNum)) {
    return { error: { status: 400, message: "Order must be a number." } };
  }
  if (orderNum < 0) {
    return {
      error: { status: 400, message: "Order must be a positive number." },
    };
  }
  return null;
}

export function parseOrderNumber(order) {
  return typeof order === "number" ? order : Number(order);
}

const priorityFiniteMessage = {
  create: "priority must be a number.",
  update: "priority must be a finite number.",
};

/**
 * @param {'create' | 'update'} mode
 */
export function validateCardBody(body, mode) {
  const { title, description, listId, dueDate, priority } = body;

  if (!title) {
    return { error: { status: 400, message: "title is required parameters." } };
  }
  if (!listId) {
    return {
      error: { status: 400, message: "list Id is required parameters." },
    };
  }
  if (
    description === undefined ||
    description === null ||
    description.length < 1
  ) {
    return {
      error: { status: 400, message: "description is a required parameter." },
    };
  }
  if (!isValidObjectId(listId)) {
    return {
      error: { status: 400, message: "listId must be a valid ObjectId." },
    };
  }
  if (!(title.length > 2)) {
    return {
      error: {
        status: 400,
        message: "title must be at least 3 characters long.",
      },
    };
  }
  if (!dueDate || isNaN(Date.parse(dueDate))) {
    return {
      error: { status: 400, message: "dueDate must be a valid date string." },
    };
  }
  if (priority === undefined || priority === null) {
    return {
      error: { status: 400, message: "priority is a required parameter." },
    };
  }
  const priorityNum =
    typeof priority === "number" ? priority : Number(priority);
  if (!Number.isFinite(priorityNum)) {
    return { error: { status: 400, message: priorityFiniteMessage[mode] } };
  } else if (priorityNum < 1 || priorityNum > 3) {
    return {
      error: {
        status: 400,
        message: "priority must be a number between 1 and 3.",
      },
    };
  }
  return null;
}
