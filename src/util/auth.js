var tokenClient; // Google Identity Services token client
var SCOPES =
  "https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile";
var DISCOVERY_DOCS = [
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
];

export function handleClientLoad(setUser, authenticatedCallback) {
  console.log("handleClientLoad called");
  console.log("window.gapi:", window.gapi);
  console.log("window.google:", window.google);

  if (!window.gapi) {
    console.error("Google API (gapi) not loaded");
    return;
  }

  // Load the Google API client
  window.gapi.load("client", () => {
    console.log("gapi client loaded");
    initClient(setUser, authenticatedCallback);
  });
}

function initClient(setUser, authenticatedCallback) {
  console.log("About to try to initialize gapi client");
  console.log("API Key:", process.env.REACT_APP_GOOGLE_API_KEY ? "Set" : "Missing");
  console.log("Client ID:", process.env.REACT_APP_GOOGLE_CLIENT_ID ? "Set" : "Missing");
  console.log("Scopes:", SCOPES);
  console.log("Discovery Docs:", DISCOVERY_DOCS);

  // Initialize the Google API client (for Calendar API calls)
  window.gapi.client
    .init({
      apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
      discoveryDocs: DISCOVERY_DOCS,
    })
    .then(function () {
      console.log("Successfully initialized gapi client");

      // Initialize Google Identity Services for authentication
      if (window.google && window.google.accounts) {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          scope: SCOPES,
          callback: (tokenResponse) => {
            console.log("Token received:", tokenResponse);
            if (tokenResponse.access_token) {
              // Set the access token for API calls
              window.gapi.client.setToken({access_token: tokenResponse.access_token});
              // Get user info and update state
              getUserInfo(setUser);
            }
          },
        });
        console.log("Google Identity Services initialized");
      } else {
        console.error("Google Identity Services not loaded");
      }

      authenticatedCallback();
    })
    .catch((err) => {
      console.error("Failed to initialize gapi client");
      console.error("Error details:", err);
      console.error("This is likely due to API key restrictions or missing API permissions");
      console.error("Check that your API key has access to Google Calendar API");
    });
}

// Get user info using the OAuth2 userinfo endpoint
async function getUserInfo(setUser) {
  try {
    // Try to get user info from the OAuth2 userinfo endpoint
    const response = await window.gapi.client.request({
      path: 'https://www.googleapis.com/oauth2/v2/userinfo',
    });

    if (response.result) {
      const userInfo = response.result;
      const newUser = {
        firstName: userInfo.given_name || '',
        lastName: userInfo.family_name || '',
        email: userInfo.email || '',
        img: userInfo.picture || '',
      };
      console.log("User info retrieved:", newUser);
      setUser(newUser);
    }
  } catch (error) {
    console.error("Failed to get user info:", error);

    // Fallback: create a basic user object without detailed info
    const basicUser = {
      firstName: 'User',
      lastName: '',
      email: 'user@example.com',
      img: '',
    };
    console.log("Using fallback user info");
    setUser(basicUser);
  }
}

// Returns true if as a result you are signed out
export function handleAuthClick() {
  console.log("handleAuthClick called");
  console.log("tokenClient:", tokenClient);

  if (!tokenClient) {
    console.error("Token client is not initialized yet");
    return false;
  }

  // Check if user is already signed in by checking if we have a token
  const currentToken = window.gapi.client.getToken();

  if (currentToken && currentToken.access_token) {
    // User is signed in, sign them out
    console.log("Signing out!");
    window.gapi.client.setToken(null);
    window.google.accounts.oauth2.revoke(currentToken.access_token);
    return true;
  } else {
    // User is not signed in, start the auth flow
    console.log("Starting sign in flow!");
    tokenClient.requestAccessToken();
    return false;
  }
}

export function userIsAuthorized() {
  const currentToken = window.gapi?.client?.getToken();
  return !!(currentToken && currentToken.access_token);
}

export function revokeAccess() {
  const currentToken = window.gapi.client.getToken();
  if (currentToken && currentToken.access_token) {
    window.google.accounts.oauth2.revoke(currentToken.access_token);
    window.gapi.client.setToken(null);
  }
}
