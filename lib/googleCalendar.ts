import { google, type calendar_v3 } from "googleapis";
import { OAuth2Client } from "google-auth-library";

/**
 * Returns a configured OAuth2 client for Google APIs.
 * Throws if required env vars are missing.
 */
export function getGoogleAuthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing Google OAuth env vars. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI in .env.local");
  }
  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

/**
 * Returns a Google Calendar client for the given OAuth2 client.
 */
export function getCalendarClient(auth: OAuth2Client) {
  return google.calendar({ version: "v3", auth });
}

/**
 * Lists upcoming events from the user's primary Google Calendar.
 * @param auth An authorized OAuth2Client
 * @param maxResults Max number of events to return (default 10)
 */
export async function listEvents(
  auth: OAuth2Client,
  maxResults = 10
): Promise<calendar_v3.Schema$Event[]> {
  const calendar = getCalendarClient(auth);
  try {
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: "startTime",
    });
    return response.data.items || [];
  } catch (error) {
    // Google API errors are often objects with 'errors' or 'message'
    const message = (error && typeof error === 'object' && 'message' in error)
      ? (error as any).message
      : String(error);
    console.error("Google Calendar API error:", message);
    throw new Error("Failed to fetch calendar events: " + message);
  }
}

/**
 * Helper: generate an OAuth consent URL for the requested scopes.
 */
export function generateAuthUrl(scopes: string[] = [
  "https://www.googleapis.com/auth/calendar.readonly",
]) {
  const client = getGoogleAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
  });
}

/**
 * Exchange an authorization code for credentials and set them on the client.
 */
export async function exchangeCodeForToken(auth: OAuth2Client, code: string) {
  const tokenResponse = await auth.getToken(code);
  auth.setCredentials(tokenResponse.tokens);
  return tokenResponse.tokens;
}