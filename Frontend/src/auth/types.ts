export const AuthRoles = {
  Admin: "Admin",
  Member: "Member",
} as const;

export type AuthRole = (typeof AuthRoles)[keyof typeof AuthRoles];

export type CurrentUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  user: CurrentUser;
};

export type RegisterInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export type ForgotPasswordInput = {
  email: string;
};

export type ResetPasswordInput = {
  email: string;
  token: string;
  newPassword: string;
  confirmNewPassword: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

export type AuthContextValue = {
  user: CurrentUser | null;
  accessToken: string | null;
  isReady: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isMember: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: AuthRole) => boolean;
  forgotPassword: (input: ForgotPasswordInput) => Promise<void>;
  resetPassword: (input: ResetPasswordInput) => Promise<void>;
  changePassword: (input: ChangePasswordInput) => Promise<void>;
};
