
import { OAuth2Client, TokenPayload, LoginTicket } from 'google-auth-library';
import appleSignin, { AppleIdTokenType } from 'apple-signin-auth';
const googleOAuth2Client = new OAuth2Client();
// const clientSecret = appleSignin.getClientSecret({
//     clientID: 'com.company.app', // Apple Client ID
//     teamID: 'teamID', // Apple Developer Team ID.
//     privateKey: 'PRIVATE_KEY_STRING', // private key associated with your client ID. -- Or provide a `privateKeyPath` property instead.
//     keyIdentifier: 'XXX', // identifier of the private key.
//     // OPTIONAL
//     expAfter: 15777000, // Unix time in seconds after which to expire the clientSecret JWT. Default is now+5 minutes.
// });
class SocialProviders {
    /**
       * Verifies the ID token and returns user data from the payload.
       * @param token - The ID token that needs to be verified
       * @param clientId - The CLIENT_ID of your app to validate against
       * @returns The user data extracted from the payload
       */
    static async verifyGoogleToken(token: string): Promise<TokenPayload> {
        const ticket: LoginTicket = await googleOAuth2Client.verifyIdToken({
            idToken: token,
            audience: [
                '156125638721-h1m1s5c074frscov5be4j38q22bm50r0.apps.googleusercontent.com',
                '156125638721-8pgj2054svmllf7301tk85vau993ujkb.apps.googleusercontent.com'
            ], // CLIENT_ID of the app that accesses the backend
        });

        // Extract the payload from the verified ticket
        const payload = ticket.getPayload();

        if (!payload) {
            throw new Error('No payload returned from the token.');
        }
        return payload;
    }
    static async verifyAppleToken(token: string): Promise<AppleIdTokenType> {
        const payload = await appleSignin.verifyIdToken(token, {
            // Optional Options for further verification - Full list can be found here https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
            audience: 'com.company.app', // client id - can also be an array
            nonce: 'NONCE', // nonce // Check this note if coming from React Native AS RN automatically SHA256-hashes the nonce https://github.com/invertase/react-native-apple-authentication#nonce
            // If you want to handle expiration on your own, or if you want the expired tokens decoded
            ignoreExpiration: true, // default is false
        });
        return payload;
    }



}
export default SocialProviders;