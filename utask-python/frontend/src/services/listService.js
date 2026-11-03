import { getLists as fetchLists, createList as apiCreateList, updateList as apiUpdateList, deleteList as apiDeleteList } from '../api/lists.js';
import { store } from '../store/store.js';

function sortListsByOrder(lists) {
    return [...lists].sort((a, b) => a.order - b.order);
}

export async function getLists(boardId) {
    if (store.lists[boardId]) {
        return store.lists[boardId];
    }
    const rawLists = await fetchLists(boardId);
    const lists = sortListsByOrder(rawLists);
    store.lists[boardId] = lists;
    return lists;
}

export async function createList(boardId, name, order) {
    const finalName = `${name}`;
    const list = await apiCreateList({ boardId, name : finalName, order });
    store.lists[boardId].push(list);
    return list;
}

export async function updateList(id, name, order, boardId) {
    const finalName = `${name}`;
    const list = await apiUpdateList(id, { name : finalName, boardId, order });
    store.lists[boardId] = store.lists[boardId].map(l => (l.id === id ? list : l));
    return list;
}

export async function deleteList(boardId, id) {
    await apiDeleteList(id);
    store.lists[boardId] = store.lists[boardId].filter(l => l.id !== id);
    return true;
}
