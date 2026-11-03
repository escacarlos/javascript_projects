import { API_BASE_URL } from './config.js';
import {doRequest} from './utils.js';

export async function createUser(username, password) {
    return doRequest(`${API_BASE_URL}/api/users/register`, 'POST', {
        username,
        password
    });
}

export async function login(username, password) {
    return await doRequest(`${API_BASE_URL}/api/users/login`, `POST`, {
        username,
        password
    });
}

export async function logout() {
    return doRequest(`${API_BASE_URL}/api/users/logout`, `POST`);
}

export async function getProfile() {
    return doRequest(`${API_BASE_URL}/api/users/profile`, `GET`);
}
