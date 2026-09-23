import { Authenticated } from "./Authenticated";
import { Anonymous } from "./Anonymous";

export function Header({
  isAuthenticated,
  user,
  isAdmin,
  isMember,
  handleLogout,
}: Readonly<{
  isAuthenticated: boolean;
  user: { email: string } | null;
  isAdmin: boolean;
  isMember: boolean;
  handleLogout: () => Promise<void>;
}>) {
  return isAuthenticated ? (
    <Authenticated
      user={user}
      isAdmin={isAdmin}
      isMember={isMember}
      handleLogout={handleLogout}
    />
  ) : (
    <Anonymous />
  );
}
