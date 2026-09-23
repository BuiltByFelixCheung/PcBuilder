import type { ReactNode } from "react";

export function PageStatus({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <section className="page-status" aria-live="polite">
      <p>{children}</p>
    </section>
  );
}
