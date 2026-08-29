export {};

declare global {
  interface GoogleTokenResponse {
    access_token?: string;
    error?: string;
    error_description?: string;
  }

  interface GoogleTokenClient {
    callback: (response: GoogleTokenResponse) => void;
    requestAccessToken: (options?: { prompt?: string }) => void;
  }

  interface GoogleIdentityServices {
    accounts: {
      oauth2: {
        initTokenClient: (options: {
          client_id: string;
          scope: string;
          callback: (response: GoogleTokenResponse) => void;
        }) => GoogleTokenClient;
        revoke: (token: string, callback: () => void) => void;
      };
    };
  }

  interface Window {
    google?: GoogleIdentityServices;
  }
}
