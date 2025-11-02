import { ReactNode } from "react";

type OnboardingLayoutProps = {
  children: ReactNode;
};

/**
 * Onboarding layout provides a clean, full-screen experience
 * without the org sidebar/topbar from the parent layout.
 * This overrides the parent's layout styling with absolute positioning.
 */
export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <div className="fixed inset-0 z-50 bg-white overflow-auto">{children}</div>
  );
}
