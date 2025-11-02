"use client";

export default function ClientMount({
  children,
}: {
  children: React.ReactNode;
}) {
  // Passthrough wrapper; avoid setState in effects to keep React hooks happy
  return children;
}
