import type { Metadata } from "next";
import GoogleEventsClient from "../../components/google-events-client";

export const metadata: Metadata = {
  title: "Google Calendar – Demo",
};

export default function Page() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Google Calendar demo</h1>
      <p className="text-sm text-gray-600 mb-4">
        Connect your Google account and list upcoming events (demo).
      </p>
      <GoogleEventsClient />
    </main>
  );
}
