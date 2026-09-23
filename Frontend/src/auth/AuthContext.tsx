import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  loginRequest,
  logoutRequest,
  registerRequest,
  forgotPasswordRequest,
  resetPasswordRequest,
  changePasswordRequest,
} from "../api/auth.ts";
import { bindAuthBridge, refreshSession } from "../api/client.ts";
import { AuthContext } from "./auth-context.ts";
import {
  AuthRoles,
  type AuthContextValue,
  type AuthRole,
  type AuthTokens,
  type CurrentUser,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type ChangePasswordInput,
} from "./types.ts";

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const accessTokenRef = useRef<string | null>(null);

  const applySession = useCallback((tokens: AuthTokens) => {
    accessTokenRef.current = tokens.accessToken;
    setAccessToken(tokens.accessToken);
    setUser(tokens.user);
  }, []);

  const clearSession = useCallback(() => {
    accessTokenRef.current = null;
    setAccessToken(null);
    setUser(null);
  }, []);

  useLayoutEffect(() => {
    bindAuthBridge({
      getAccessToken: () => accessTokenRef.current,
      applySession,
      clearSession,
    });
  }, [applySession, clearSession]);

  useEffect(() => {
    let cancelled = false;

    void refreshSession().finally(() => {
      if (!cancelled) setIsReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await loginRequest(email, password);
      applySession(tokens);
    },
    [applySession],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      await registerRequest(input);
      await login(input.email, input.password);
    },
    [login],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const forgotPassword = useCallback(async (input: ForgotPasswordInput) => {
    await forgotPasswordRequest(input);
  }, []);

  const resetPassword = useCallback(
    async (input: ResetPasswordInput) => {
      await resetPasswordRequest(input);
      clearSession();
    },
    [clearSession],
  );

  const changePassword = useCallback(
    async (input: ChangePasswordInput) => {
      await changePasswordRequest(input);
      clearSession();
    },
    [clearSession],
  );

  const hasRole = useCallback(
    (role: AuthRole) => user?.roles.includes(role) ?? false,
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isReady,
      isAuthenticated: user !== null,
      isAdmin: hasRole(AuthRoles.Admin),
      isMember: hasRole(AuthRoles.Member),
      login,
      register,
      forgotPassword,
      resetPassword,
      logout,
      hasRole,
      changePassword,
    }),
    [
      user,
      accessToken,
      isReady,
      hasRole,
      login,
      register,
      logout,
      forgotPassword,
      resetPassword,
      changePassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
