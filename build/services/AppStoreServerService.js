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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../config/constants");
const app_store_server_library_1 = require("@apple/app-store-server-library");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class AppStoreServerService {
    constructor() {
        this.appAppleId = 6670192036;
        this.issuerId = "6717dd9a-c3ee-452d-aa7a-fb25c3d370fe";
        this.keyId = "3CM9F6HZD3";
        this.bundleId = "com.thehotelmedia.ios";
        this.filePath = "/certificates/SubscriptionKey_3CM9F6HZD3.p8";
        this.environment = (constants_1.AppConfig.APP_ENV === "production") ? app_store_server_library_1.Environment.PRODUCTION : app_store_server_library_1.Environment.SANDBOX;
    }
    client() {
        return __awaiter(this, void 0, void 0, function* () {
            const encodedKey = fs_1.default.readFileSync(__dirname + this.filePath, 'utf8');
            return new app_store_server_library_1.AppStoreServerAPIClient(encodedKey, this.keyId, this.issuerId, this.bundleId, this.environment);
        });
    }
    signedDataVerifier(environment) {
        return __awaiter(this, void 0, void 0, function* () {
            const appleRootCAs = yield this.loadRootCAs(); // Specific implementation may vary
            const enableOnlineChecks = true;
            let _environment = this.environment;
            if (environment && environment === app_store_server_library_1.Environment.SANDBOX) {
                _environment = app_store_server_library_1.Environment.SANDBOX;
                console.log("_environment", _environment, "actual", this.environment);
            }
            if (environment && environment === app_store_server_library_1.Environment.PRODUCTION) {
                _environment = app_store_server_library_1.Environment.PRODUCTION;
                console.log("_environment", _environment, "actual", this.environment);
            }
            return new app_store_server_library_1.SignedDataVerifier(appleRootCAs, enableOnlineChecks, _environment, this.bundleId, this.appAppleId);
        });
    }
    requestTestNotification() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const client = yield this.client();
                return yield client.requestTestNotification();
            }
            catch (e) {
                console.error("requestTestNotification", e);
                throw new Error('Failed to request test notification');
            }
        });
    }
    verifyAndDecodeTransaction(signedTransactionInfo, environment) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const verifier = yield this.signedDataVerifier(environment);
                return yield verifier.verifyAndDecodeTransaction(signedTransactionInfo);
            }
            catch (e) {
                console.error("verifyAndDecodeTransaction", e);
                throw new Error('Failed to verify and decode transaction');
            }
        });
    }
    verifyAndDecodeAppTransaction(signedAppTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const verifier = yield this.signedDataVerifier();
                return yield verifier.verifyAndDecodeAppTransaction(signedAppTransaction);
            }
            catch (e) {
                console.error("verifyAndDecodeAppTransaction", e);
                throw new Error('Failed to verify and decode app transaction');
            }
        });
    }
    verifyAndDecodeNotification(signedPayload, environment) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const verifier = yield this.signedDataVerifier(environment);
                return yield verifier.verifyAndDecodeNotification(signedPayload);
            }
            catch (e) {
                console.error("verifyAndDecodeNotification", e);
                throw new Error('Failed to verify and decode notification');
            }
        });
    }
    verifyAndDecodeRenewalInfo(signedRenewalInfo, environment) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const verifier = yield this.signedDataVerifier(environment);
                return yield verifier.verifyAndDecodeRenewalInfo(signedRenewalInfo);
            }
            catch (e) {
                console.error("verifyAndDecodeRenewalInfo", e);
                throw new Error('Failed to verify and decode renewal info');
            }
        });
    }
    loadRootCAs() {
        return __awaiter(this, void 0, void 0, function* () {
            // Path to the directory containing root certificate files
            const certDirectory = path_1.default.join(__dirname, 'certificates');
            // List of Apple root certificates to load
            // Get Apple Root Certificate (downloaded here: https://www.apple.com/certificateauthority/), 
            // convert using "openssl x509 -inform der -in AppleRootCA-G3.cer -out AppleRootCA-G3.pem"
            const certFiles = ['AppleIncRootCertificate.pem', 'AppleRootCA-G2.pem', 'AppleRootCA-G3.pem']; // Example, add as needed
            const rootCAs = [];
            certFiles.forEach(certFile => {
                const certPath = path_1.default.join(certDirectory, certFile);
                try {
                    const certData = fs_1.default.readFileSync(certPath);
                    rootCAs.push(certData);
                }
                catch (err) {
                    console.error(`Error loading certificate: ${certFile}`, err);
                }
            });
            return rootCAs;
        });
    }
}
exports.default = AppStoreServerService;
