import { getBoards as fetchBoards, createBoard as apiCreateBoard, updateBoard as apiUpdateBoard, deleteBoard as apiDeleteBoard } from '../api/boards.js';
import { store } from '../store/store.js';

export async function getBoards() {
    if (store.boards) {
        return store.boards;
    }
    const boards = await fetchBoards();
    store.boards = boards;
    return boards;
}

export async function createBoard(name, description) {
    const payload = { name, description, userId: store.user.id };
    const board = await apiCreateBoard(payload);
    store.boards.unshift(board);
    return board;
}

export async function updateBoard(id, name, description) {
    const payload = { name, description };
    const board = await apiUpdateBoard(id, payload);
    store.boards = store.boards.map(b => (b.id === id ? board : b));
    return board;
}

export async function deleteBoard(id) {
    await apiDeleteBoard(id);
    store.boards = store.boards.filter(b => b.id !== id);
    return true;
}
