import { ReactNode } from "react";

type MeetingRoomLayoutProps = {
  children: ReactNode;
};

export default function MeetingRoomLayout({
  children,
}: MeetingRoomLayoutProps) {
  // Meeting room uses its own full-screen layout without sidebar
  return <>{children}</>;
}
