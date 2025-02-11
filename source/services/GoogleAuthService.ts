import { google, } from "googleapis";
import { GetAccessTokenResponse, } from "google-auth-library/build/src/auth/oauth2client";
import { AppConfig, } from '../config/constants';
import { GoogleAuth, JWT, AnyAuthClient } from "google-auth-library";
import { JSONClient } from "google-auth-library/build/src/auth/googleauth";

export class GoogleAuthService {
    async getAccessToken(): Promise<{
        authClient: AnyAuthClient,
        token: GetAccessTokenResponse,
        auth: GoogleAuth<JSONClient>;
    }> {
        try {
            // Set up OAuth2 client with service account credentials
            const auth = new google.auth.GoogleAuth({
                credentials: {
                    client_email: AppConfig.FIREBASE.CLIENT_EMAIL,
                    private_key: AppConfig.FIREBASE.PRIVATE_KEY,
                },
                projectId: AppConfig.FIREBASE.PROJECT_ID,
                scopes: ['https://www.googleapis.com/auth/androidpublisher'],
            });
            // Get the auth client (which includes the access token)
            const authClient = await auth.getClient();

            // The access token (Bearer Token) is available through the `credentials` object of the `authClient`
            const token = await authClient.getAccessToken()
            return { authClient, token, auth };
        } catch (error) {
            console.error('Error verifying Google token:', error);
            throw new Error('Failed to authenticate user');
        }
    }
}