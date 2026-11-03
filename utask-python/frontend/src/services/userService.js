import { createUser as apiCreateUser, login as apiLogin, logout as apiLogout, getProfile as apiGetProfile } from '../api/user.js';
import { store } from '../store/store.js';

export async function createUser(username, password) {
    try {
        return await apiCreateUser(username, password);
    } catch (err) {
        throw new Error(err.body?.errors?.message || 'Cannot create user');
    }
}


export async function login(username, password) {
    return await apiLogin(username, password).then(response => {
        store.setToken(response.token)
        store.setUser(response.user)
        return response
    })
}

export async function logout() {
    await apiLogout().finally(() => {
        store.setToken(undefined)
        store.setUser(undefined)
    });
}

export async function getProfile() {
    return apiGetProfile()
}