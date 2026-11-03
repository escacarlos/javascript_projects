import { API_BASE_URL } from './config.js';
import { doRequest } from './utils.js';

export async function getCards(listId) {
    return doRequest(`${API_BASE_URL}/api/cards/list/${listId}`, 'GET');
}

export async function createCard(payload) {
    return doRequest(`${API_BASE_URL}/api/cards`, 'POST', payload);
}

export async function updateCard(id, payload) {
    return doRequest(`${API_BASE_URL}/api/cards/${id}`, 'PUT', payload);
}

export async function deleteCard(id) {
    return doRequest(`${API_BASE_URL}/api/cards/${id}`, 'DELETE');
}
