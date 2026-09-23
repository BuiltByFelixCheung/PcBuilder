import { api } from "./client";
import type {
  AuthTokens,
  CurrentUser,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from "../auth/types";

export function loginRequest(email: string, password: string) {
  return api
    .post<AuthTokens>("/auth/login", { email, password })
    .then((response) => response.data);
}

export function registerRequest(input: RegisterInput) {
  return api
    .post<CurrentUser>("/auth/register", input)
    .then((response) => response.data);
}

export function logoutRequest() {
  return api.post("/auth/logout", {});
}

export function meRequest() {
  return api.get<CurrentUser>("/auth/me").then((response) => response.data);
}

export function forgotPasswordRequest(input: ForgotPasswordInput) {
  return api
    .post("/auth/forgot-password", input)
    .then((response) => response.data);
}

export function resetPasswordRequest(input: ResetPasswordInput) {
  return api
    .post("/auth/reset-password", input)
    .then((response) => response.data);
}

export function changePasswordRequest(input: ChangePasswordInput) {
  return api
    .post("/auth/change-password", input)
    .then((response) => response.data);
}
