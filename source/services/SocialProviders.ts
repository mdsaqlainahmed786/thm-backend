
import { OAuth2Client, TokenPayload, LoginTicket } from 'google-auth-library';
import appleSignin, { AppleIdTokenType, } from 'apple-signin-auth';
import { AppConfig } from '../config/constants';
const googleOAuth2Client = new OAuth2Client();
const currentUnixTime = Math.floor(Date.now() / 1000);
const expirationDurationInSeconds = 600; // 10 minutes 
const expAfter = currentUnixTime + expirationDurationInSeconds;
const clientSecret = appleSignin.getClientSecret({
    clientID: AppConfig.APPLE.CLIENT_ID,
    teamID: AppConfig.APPLE.TEAM_ID,
    privateKey: AppConfig.APPLE.PRIVATE_KEY,
    keyIdentifier: AppConfig.APPLE.KEY_IDENTIFIER,
    // OPTIONAL
    // expAfter: expAfter, // Unix time in seconds after which to expire the clientSecret JWT. Default is now+5 minutes.
});
class SocialProviders {
    /**
       * Verifies the ID token and returns user data from the payload.
       * @param token - The ID token that needs to be verified
       * @param clientId - The CLIENT_ID of your app to validate against
       * @returns The user data extracted from the payload
       */
    static async verifyGoogleToken(token: string): Promise<TokenPayload> {
        const ticket = await googleOAuth2Client.verifyIdToken({
          idToken: token,
        });
      
        const payload = ticket.getPayload();
        if (!payload) {
          throw new Error('Invalid Google token');
        }
      
        const ALLOWED_AUDIENCES = new Set([
          '863883177284-fo7lcn907hhfntd7t31k14o7omhkg93h.apps.googleusercontent.com', // Android (web client)
          '156125638721-h1m1s5c074frscov5be4j38q22bm50r0.apps.googleusercontent.com', // iOS
          '156125638721-8pgj2054svmllf7301tk85vau993ujkb.apps.googleusercontent.com', // iOS
          '156125638721-eeh3s3mk2te4g38d3emuif6mqnlb7e15.apps.googleusercontent.com', // iOS
        ]);
      
        if (!ALLOWED_AUDIENCES.has(payload.aud)) {
          throw new Error(`Unauthorized Google client: ${payload.aud}`);
        }
      
        return payload;
      }
      
    static async getAppleAuthorizationToken(code: string) {
        try {
            const options = {
                clientID: AppConfig.APPLE.CLIENT_ID, // Apple Client ID
                redirectUri: '/auth/apple/callback', // use the same value which you passed to authorisation URL.
                clientSecret: clientSecret
            };
            const tokenResponse = await appleSignin.getAuthorizationToken(code, options);
            if (tokenResponse.id_token) {
                const payload = await this.verifyAppleToken(tokenResponse.id_token);
                return payload;
            }
            throw new Error((tokenResponse as any).error_description);
        } catch (error) {
            throw error;
        }

    }
    static async verifyAppleToken(token: string): Promise<AppleIdTokenType> {
        try {
            const payload = await appleSignin.verifyIdToken(token, {
                // Optional Options for further verification - Full list can be found here https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
                clientID: AppConfig.APPLE.CLIENT_ID, // client id - can also be an array
                // nonce: 'NONCE', // Check this note if coming from React Native AS RN automatically SHA256-hashes the nonce https://github.com/invertase/react-native-apple-authentication#nonce
                // If you want to handle expiration on your own, or if you want the expired tokens decoded
                ignoreExpiration: true, // default is false
            });
            this.validateTokenProperties(payload);
            return payload;
        } catch (error) {
            throw error;
        }
    }
    static validateTokenProperties(payload: AppleIdTokenType) {
        if (!payload.iss.includes('https://appleid.apple.com')) {
            throw new Error('Token issuer is invalid.');
        }
        if (payload.aud !== AppConfig.APPLE.CLIENT_ID) {
            throw new Error('Token audience is invalid.');
        }
        if (!payload.sub) {
            throw new Error('Token subject is invalid.');
        }
        if (!payload.email_verified) {
            throw new Error('Email not verified.');
        }
        // if (payload.nonce && payload.nonce !== clientNonce) {
        //     throw new AppleAuthError('Nonce is invalid.');
        // }
    }


}
export default SocialProviders;