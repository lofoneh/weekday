/**
 * Fetches today's events from Google Calendar API and logs the raw response to the console
 * 
 * @param accessToken Your Google API access token
 * @param calendarId Optional specific calendar ID (defaults to primary)
 * @returns The raw response from the Google Calendar API
 */
async function fetchTodayEvents(accessToken: string, calendarId: string = 'primary'): Promise<any> {
  // Calculate today's start and end timestamps
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  
  // Format timestamps for API
  const timeMinISO = todayStart.toISOString();
  const timeMaxISO = todayEnd.toISOString();

  // Set up headers with auth token
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${accessToken}`);
  headers.append("Accept", "application/json");

  // Set up request parameters
  const params = new URLSearchParams({
    maxResults: "2500",
    orderBy: "startTime",
    singleEvents: "true",
    timeMax: timeMaxISO,
    timeMin: timeMinISO,
  });

  // Construct the full URL
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`;

  try {
    // Make the API request
    const response = await fetch(url, {
      cache: "no-cache",
      headers,
      method: "GET",
      mode: "cors",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching calendar events: ${response.status} - ${response.statusText}`);
      console.error(`Error details: ${errorText}`);
      return null;
    }

    // Parse the response
    const data = await response.json();
    
    // Log the raw response to console
    console.log('Today\'s events from Google Calendar API:');
    console.log(data);
    
    // Return the raw data
    return data;
    
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return null;
  }
}

// Example usage:
// Replace 'YOUR_ACCESS_TOKEN' with a valid Google OAuth access token
// fetchTodayEvents('YOUR_ACCESS_TOKEN');

// To execute this file directly:
// 1. Add your access token to the line below
// 2. Uncomment the line below
// 3. Run with: npx ts-node fetchTodayEvents.ts

// fetchTodayEvents('YOUR_ACCESS_TOKEN');

export default fetchTodayEvents;
