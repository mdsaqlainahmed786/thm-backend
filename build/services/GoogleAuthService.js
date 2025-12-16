"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAuthService = void 0;
const googleapis_1 = require("googleapis");
const constants_1 = require("../config/constants");
class GoogleAuthService {
    getAccessToken() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Set up OAuth2 client with service account credentials
                const auth = new googleapis_1.google.auth.GoogleAuth({
                    credentials: {
                        client_email: constants_1.AppConfig.FIREBASE.CLIENT_EMAIL,
                        private_key: constants_1.AppConfig.FIREBASE.PRIVATE_KEY,
                    },
                    projectId: constants_1.AppConfig.FIREBASE.PROJECT_ID,
                    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
                });
                // Get the auth client (which includes the access token)
                const authClient = yield auth.getClient();
                // The access token (Bearer Token) is available through the `credentials` object of the `authClient`
                const token = yield authClient.getAccessToken();
                return { authClient, token, auth };
            }
            catch (error) {
                console.error('Error verifying Google token:', error);
                throw new Error('Failed to authenticate user');
            }
        });
    }
}
exports.GoogleAuthService = GoogleAuthService;
