import { getCards as fetchCards, createCard as apiCreateCard, updateCard as apiUpdateCard, deleteCard as apiDeleteCard } from '../api/cards.js';
import { store } from '../store/store.js';

function sortCardsBy(sortType, cards) {
    if (!cards || !cards.length) return cards;
    return [...cards].sort((a, b) => {
        if (sortType === 'sortByDate') {
            const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
            const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
            return dateA - dateB;
        } else if (sortType === 'sortByPriority') {
            const priorityA = a.priority ?? Infinity;
            const priorityB = b.priority ?? Infinity;
            return priorityA - priorityB;
        }
        return 0;
    });
}

function applySortAndUpdateStore(listId, cards) {
    const sorted = sortCardsBy(store.sorting, cards);
    store.cards[listId] = sorted;
    return sorted;
}

export async function getCards(listId) {
    if (store.cards[listId]) {
        return store.cards[listId];
    }
    const cards = await fetchCards(listId);
    applySortAndUpdateStore(listId, cards);
    return cards;
}

export async function createCard(card) {
    const created = await apiCreateCard(card);
    store.cards[card.listId].push(created);
    applySortAndUpdateStore(created.listId, store.cards[created.listId]);
    return created;
}

export async function updateCard(card) {
    const updated = await apiUpdateCard(card.id, card);
    const list = store.cards[card.listId];
    const index = list.findIndex(c => c.id === card.id);
    if (index === -1) {
        list.push(updated);
    } else {
        list.splice(index, 1, updated);
    }
    applySortAndUpdateStore(updated.listId, store.cards[updated.listId]);
    return updated;
}

export async function deleteCard(listId, id) {
    await apiDeleteCard(id);
    store.cards[listId] = store.cards[listId].filter(c => c.id !== id);
    return true;
}

export function sortCards(listId, cards) {
    const list = cards ?? store.cards[listId];
    if (!list) return;
    applySortAndUpdateStore(listId, list);
}
