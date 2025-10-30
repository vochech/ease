import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn("Google OAuth credentials missing. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local");
}

// Create OAuth2 client
export function getGoogleAuthClient() {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// Create Calendar client with auth
export function getCalendarClient(auth: OAuth2Client) {
  return google.calendar({ version: "v3", auth });
}

// Example: List upcoming events
export async function listEvents(auth: OAuth2Client) {
  try {
    const calendar = getCalendarClient(auth);
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });

    return response.data.items || [];
  } catch (error) {
    console.error("Google Calendar API error:", error);
    throw new Error("Failed to fetch calendar events");
  }
}