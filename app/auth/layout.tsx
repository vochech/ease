import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  // Explicit auth layout to ensure a mounted layout router boundary for client pages
  return <>{children}</>;
}
