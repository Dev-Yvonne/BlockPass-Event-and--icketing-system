import { User, UserRole } from "../types";
import {
  apiError,
  delay,
  getCurrentUser,
  getUsers,
  newId,
  saveUsers,
  tokenFor,
  toPublicUser,
} from "../mockStore";

interface AuthResponse {
  token: string;
  user: User;
}

export function register(name: string, email: string, password: string, role: UserRole) {
  const users = getUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return Promise.reject(apiError("An account with that email already exists"));
  }
  const user = { id: newId("user"), name, email, role, password };
  users.push(user);
  saveUsers(users);
  return delay<AuthResponse>({ token: tokenFor(user.id), user: toPublicUser(user) });
}

export function login(email: string, password: string) {
  const match = getUsers().find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (!match) {
    return Promise.reject(apiError("Invalid email or password"));
  }
  return delay<AuthResponse>({ token: tokenFor(match.id), user: toPublicUser(match) });
}

export function getMe() {
  const user = getCurrentUser();
  if (!user) return Promise.reject(apiError("Not authenticated"));
  return delay<User>(toPublicUser(user));
}
