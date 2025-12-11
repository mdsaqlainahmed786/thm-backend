import { AppConfig } from "../config/constants";
import { AppStoreServerAPIClient, SignedDataVerifier, Environment, SendTestNotificationResponse, ResponseBodyV2DecodedPayload, JWSRenewalInfoDecodedPayload, AppTransaction, JWSTransactionDecodedPayload } from "@apple/app-store-server-library"
import { Environment as AppEnvironment } from "../common";
import fs, { readFile } from "fs";
import path from "path";

class AppStoreServerService {

    private issuerId: string;
    private keyId: string;
    private bundleId: string;
    private filePath: string;
    private environment: Environment;
    private appAppleId: number;
    constructor() {
        this.appAppleId = 6670192036;
        this.issuerId = "6717dd9a-c3ee-452d-aa7a-fb25c3d370fe";
        this.keyId = "3CM9F6HZD3";
        this.bundleId = "com.thehotelmedia.ios";
        this.filePath = "/certificates/SubscriptionKey_3CM9F6HZD3.p8";
        this.environment = (AppConfig.APP_ENV === "production") ? Environment.PRODUCTION : Environment.SANDBOX;
    }
    async client() {
        const encodedKey = fs.readFileSync(__dirname + this.filePath, 'utf8');
        return new AppStoreServerAPIClient(encodedKey, this.keyId, this.issuerId, this.bundleId, this.environment)
    }
    async signedDataVerifier(environment?: string) {
        const appleRootCAs: Buffer[] = await this.loadRootCAs() // Specific implementation may vary
        const enableOnlineChecks = true
        let _environment = this.environment;
        if (environment && environment === Environment.SANDBOX) {
            _environment = Environment.SANDBOX;
            console.log("_environment", _environment, "actual", this.environment);
        }
        if (environment && environment === Environment.PRODUCTION) {
            _environment = Environment.PRODUCTION;
            console.log("_environment", _environment, "actual", this.environment);
        }
        return new SignedDataVerifier(appleRootCAs, enableOnlineChecks, _environment, this.bundleId, this.appAppleId);
    }
    async requestTestNotification(): Promise<SendTestNotificationResponse> {
        try {
            const client = await this.client();
            return await client.requestTestNotification();
        } catch (e) {
            console.error("requestTestNotification", e);
            throw new Error('Failed to request test notification');
        }
    }
    async verifyAndDecodeTransaction(signedTransactionInfo: string, environment?: string): Promise<JWSTransactionDecodedPayload> {
        try {
            const verifier = await this.signedDataVerifier(environment);
            return await verifier.verifyAndDecodeTransaction(signedTransactionInfo);
        } catch (e) {
            console.error("verifyAndDecodeTransaction", e);
            throw new Error('Failed to verify and decode transaction');
        }
    }
    async verifyAndDecodeAppTransaction(signedAppTransaction: string,): Promise<AppTransaction> {
        try {
            const verifier = await this.signedDataVerifier();
            return await verifier.verifyAndDecodeAppTransaction(signedAppTransaction);
        } catch (e) {
            console.error("verifyAndDecodeAppTransaction", e);
            throw new Error('Failed to verify and decode app transaction');
        }
    }
    async verifyAndDecodeNotification(signedPayload: string, environment?: string): Promise<ResponseBodyV2DecodedPayload> {
        try {
            const verifier = await this.signedDataVerifier(environment);
            return await verifier.verifyAndDecodeNotification(signedPayload);
        } catch (e) {
            console.error("verifyAndDecodeNotification", e);
            throw new Error('Failed to verify and decode notification');
        }
    }
    async verifyAndDecodeRenewalInfo(signedRenewalInfo: string, environment?: string): Promise<JWSRenewalInfoDecodedPayload> {
        try {
            const verifier = await this.signedDataVerifier(environment);
            return await verifier.verifyAndDecodeRenewalInfo(signedRenewalInfo);
        } catch (e) {
            console.error("verifyAndDecodeRenewalInfo", e);
            throw new Error('Failed to verify and decode renewal info');
        }
    }

    async loadRootCAs(): Promise<Buffer[]> {
        // Path to the directory containing root certificate files
        const certDirectory = path.join(__dirname, 'certificates');

        // List of Apple root certificates to load
        // Get Apple Root Certificate (downloaded here: https://www.apple.com/certificateauthority/), 
        // convert using "openssl x509 -inform der -in AppleRootCA-G3.cer -out AppleRootCA-G3.pem"
        const certFiles = ['AppleIncRootCertificate.pem', 'AppleRootCA-G2.pem', 'AppleRootCA-G3.pem']; // Example, add as needed
        const rootCAs: Buffer[] = [];
        certFiles.forEach(certFile => {
            const certPath = path.join(certDirectory, certFile);
            try {
                const certData = fs.readFileSync(certPath);
                rootCAs.push(certData);
            } catch (err) {
                console.error(`Error loading certificate: ${certFile}`, err);
            }
        });
        return rootCAs;
    }

}


export default AppStoreServerService;