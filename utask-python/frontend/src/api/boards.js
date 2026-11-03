import { API_BASE_URL } from './config.js';
import { doRequest } from './utils.js';

export async function getBoards() {
    return doRequest(`${API_BASE_URL}/api/boards`, 'GET');
}

export async function createBoard(payload) {
    return doRequest(`${API_BASE_URL}/api/boards`, 'POST', payload);
}

export async function updateBoard(id, payload) {
    return doRequest(`${API_BASE_URL}/api/boards/${id}`, 'PUT', payload);
}

export async function deleteBoard(id) {
    return doRequest(`${API_BASE_URL}/api/boards/${id}`, 'DELETE');
}
