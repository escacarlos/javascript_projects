import { API_BASE_URL } from './config.js';
import { doRequest } from './utils.js';

export async function getLists(boardId) {
    return doRequest(`${API_BASE_URL}/api/lists/board/${boardId}`, 'GET');
}

export async function createList(payload) {
    return doRequest(`${API_BASE_URL}/api/lists`, 'POST', payload);
}

export async function updateList(id, payload) {
    return doRequest(`${API_BASE_URL}/api/lists/${id}`, 'PUT', payload);
}

export async function deleteList(id) {
    return doRequest(`${API_BASE_URL}/api/lists/${id}`, 'DELETE');
}
