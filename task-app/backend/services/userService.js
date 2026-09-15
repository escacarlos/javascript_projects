import { loginUser, logoutUser } from "../middleware/authentication.js";
import { hashPassword } from "../utils/password.js";

import { User } from "../repositories/User.js";

export async function login(username, password) {
  const user = await User.findOne({
    username,
    password: hashPassword(password),
  });
  const result = loginUser(user);
  if (!result) return null;
  return { token: result.token, user: user.toJSON() };
}

export async function logout(token) {
  logoutUser(token);
}

export async function register(username, password) {
  const trimmedUsername = typeof username === "string" ? username.trim() : "";
  if (!trimmedUsername || typeof password !== "string" || !password) {
    return {
      error: { status: 400, message: "Username and password are required" },
    };
  }

  const existingUser = await User.findOne({ username: trimmedUsername });
  if (existingUser) {
    return { error: { status: 409, message: "User already exists" } };
  }

  const hashedPassword = hashPassword(password);
  const newUser = new User({
    username: trimmedUsername,
    password: hashedPassword,
  });

  await newUser.save();

  return { data: newUser.toJSON() };
}

export async function getProfile(userId) {
  const user = await User.findById(userId);
  if (!user) return null;
  return user.toJSON();
}
