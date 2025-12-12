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
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const client_ses_1 = require("@aws-sdk/client-ses");
class EmailNotificationService {
    constructor() {
        this.privacyPolicyLink = "https://thehotelmedia.com/privacy-policy";
        this.termsAndConditions = "https://thehotelmedia.com/terms-and-conditions";
        this.sesClient = new client_ses_1.SESClient({
            region: constants_1.AppConfig.SES.REGION,
            // In production prefer IAM role. For local dev using env keys, the SDK will pick up
            // AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY automatically. If you want explicit:
            credentials: { accessKeyId: constants_1.AppConfig.SES.ACCESS_KEY_ID, secretAccessKey: constants_1.AppConfig.SES.SECRET_ACCESS_KEY }
        });
        this.fromAddress = constants_1.AppConfig.SES.FROM_ADDRESS;
    }
    sendEmailOTP(otp, toAddress, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let subject = "";
                let textBody = "";
                let htmlBody = "";
                if (reason === "verify-email") {
                    subject = "Verify your email address";
                    textBody = `Hi there,\nTo complete your registration, please use this OTP: ${otp}. Do not share it.`;
                    htmlBody = yield this.verifyEmailTemplate(otp);
                }
                else {
                    subject = "Password reset request";
                    textBody = `Use this OTP to reset your password: ${otp}.`;
                    htmlBody = yield this.forgotPasswordTemplate(otp);
                }
                const params = {
                    Source: `${constants_1.AppConfig.APP_NAME} <${this.fromAddress}>`,
                    Destination: { ToAddresses: [toAddress] },
                    Message: {
                        Subject: { Data: subject },
                        Body: { Text: { Data: textBody }, Html: { Data: htmlBody } }
                    }
                };
                if (constants_1.AppConfig.APP_ENV !== "dev") {
                    const command = new client_ses_1.SendEmailCommand(Object.assign(Object.assign({}, params), { ConfigurationSetName: undefined }));
                    yield this.sesClient.send(command);
                }
                else {
                    console.log("SES (dev) sendEmailOTP", params);
                }
            }
            catch (err) {
                console.error("EmailNotificationService sendEmailOTP (SES)", err);
            }
        });
    }
    sendSubscriptionEmail(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { toAddress, name, cc, subscriptionName, orderID, purchaseDate, grandTotal, transactionID, paymentMethod } = data;
                const subject = "Subscription Purchased";
                const textBody = `Hello ${name},\nThank you for purchasing the ${subscriptionName} subscription! Order: ${orderID}`;
                const htmlBody = yield this.subscriptionEmailTemplate(name, subscriptionName, orderID, purchaseDate, grandTotal, transactionID, paymentMethod);
                const ccUnique = cc.filter(e => e && e !== toAddress);
                const params = {
                    Source: `${constants_1.AppConfig.APP_NAME} <${this.fromAddress}>`,
                    Destination: { ToAddresses: [toAddress], CcAddresses: ccUnique },
                    Message: {
                        Subject: { Data: subject },
                        Body: { Text: { Data: textBody }, Html: { Data: htmlBody } }
                    }
                };
                if (constants_1.AppConfig.APP_ENV !== "dev") {
                    const command = new client_ses_1.SendEmailCommand(Object.assign(Object.assign({}, params), { ConfigurationSetName: undefined }));
                    yield this.sesClient.send(command);
                }
                else {
                    console.log("SES (dev) sendSubscriptionEmail", params);
                }
            }
            catch (err) {
                console.error("EmailNotificationService sendSubscriptionEmail (SES)", err);
            }
        });
    }
    // --- template helpers (unchanged, using your files)
    subscriptionEmailTemplate(name, subscriptionName, orderID, purchaseDate, grandTotal, transactionID, paymentMethod) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileData = yield this.readTemplate("/template/subscription.html");
            return fileData
                .replace(/{{Name}}/g, name)
                .replace(/{{SubscriptionName}}/g, subscriptionName)
                .replace(/{{TransactionID}}/g, transactionID)
                .replace(/{{PaymentMethod}}/g, paymentMethod)
                .replace(/{{OrderID}}/g, orderID)
                .replace(/{{GrandTotal}}/g, grandTotal)
                .replace(/{{PurchaseDate}}/g, purchaseDate)
                .replace(/{{Logo}}/g, `https://thehotelmedia.com/public/files/thm-logo-md.png`)
                .replace(/{{PrivacyPolicyLink}}/g, this.privacyPolicyLink)
                .replace(/{{TermsAndConditions}}/g, this.termsAndConditions)
                .replace(/{{AppName}}/g, constants_1.AppConfig.APP_NAME);
        });
    }
    verifyEmailTemplate(otp) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileData = yield this.readTemplate("/template/verify-email.html");
            return fileData.replace(/{{OTP}}/g, otp.toString()).replace(/{{Logo}}/g, `https://thehotelmedia.com/public/files/thm-logo-md.png`).replace(/{{AppName}}/g, constants_1.AppConfig.APP_NAME);
        });
    }
    forgotPasswordTemplate(otp) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileData = yield this.readTemplate("/template/forgot-password.html");
            return fileData.replace(/{{OTP}}/g, otp.toString()).replace(/{{Logo}}/g, `https://thehotelmedia.com/public/files/thm-logo-md.png`).replace(/{{AppName}}/g, constants_1.AppConfig.APP_NAME);
        });
    }
    fileExists(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield promises_1.default.access(filePath);
                return true;
            }
            catch (_a) {
                return false;
            }
        });
    }
    readTemplate(templatePath) {
        return __awaiter(this, void 0, void 0, function* () {
            // Normalize incoming path (remove leading slash)
            const cleaned = templatePath.startsWith('/') ? templatePath.slice(1) : templatePath;
            const candidates = [
                path_1.default.join(__dirname, cleaned), // e.g. build/services/template/verify-email.html
                path_1.default.join(process.cwd(), 'build', cleaned), // e.g. CWD/build/services/template/verify-email.html
                path_1.default.join(process.cwd(), cleaned), // e.g. CWD/services/template/verify-email.html
                path_1.default.join(process.cwd(), 'src', cleaned), // e.g. CWD/src/services/template/verify-email.html
                path_1.default.join(process.cwd(), 'src', 'services', cleaned.replace(/^template[\\/]/, '')), // fallback
                path_1.default.join(process.cwd(), 'template', cleaned), // e.g. CWD/template/verify-email.html
            ].map(p => path_1.default.normalize(p));
            for (const p of candidates) {
                if (yield this.fileExists(p)) {
                    return yield promises_1.default.readFile(p, 'utf-8');
                }
            }
            // If none found, throw with useful message
            throw new Error(`Template not found. Tried these paths:\n${candidates.join('\n')}`);
        });
    }
    readLogo() {
        return __awaiter(this, void 0, void 0, function* () {
            // PUBLIC_DIR may be absolute or relative. Try common locations.
            const logoCandidates = [
                // If PUBLIC_DIR is set and points to folder
                constants_1.AppConfig.PUBLIC_DIR ? path_1.default.join(constants_1.AppConfig.PUBLIC_DIR, 'thm-logo.png') : null,
                path_1.default.join(__dirname, '..', '..', 'public', 'files', 'thm-logo.png'), // build/services -> build/public/files/...
                path_1.default.join(process.cwd(), 'public', 'files', 'thm-logo.png'),
                path_1.default.join(process.cwd(), 'build', 'public', 'files', 'thm-logo.png'),
                path_1.default.join(process.cwd(), 'public', 'thm-logo.png'),
                path_1.default.join(process.cwd(), 'build', 'public', 'thm-logo.png'),
            ].filter(Boolean);
            for (const p of logoCandidates) {
                if (yield this.fileExists(p)) {
                    const logoData = yield promises_1.default.readFile(p);
                    return logoData.toString('base64');
                }
            }
            // Not fatal — return empty string or a small fallback so templates still render
            console.warn('Logo not found. Tried paths:\n' + logoCandidates.join('\n'));
            return '';
        });
    }
    sendBookingEmail(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Placeholder implementation - email sending logic can be added later
                if (constants_1.AppConfig.APP_ENV !== "dev") {
                    console.log("SES (prod) sendBookingEmail", data);
                }
                else {
                    console.log("SES (dev) sendBookingEmail", data);
                }
            }
            catch (err) {
                console.error("EmailNotificationService sendBookingEmail (SES)", err);
            }
        });
    }
    sendBookingConfirmationEmail(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Placeholder implementation - email sending logic can be added later
                if (constants_1.AppConfig.APP_ENV !== "dev") {
                    console.log("SES (prod) sendBookingConfirmationEmail", data);
                }
                else {
                    console.log("SES (dev) sendBookingConfirmationEmail", data);
                }
            }
            catch (err) {
                console.error("EmailNotificationService sendBookingConfirmationEmail (SES)", err);
            }
        });
    }
    sendBookingCancellationEmail(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Placeholder implementation - email sending logic can be added later
                if (constants_1.AppConfig.APP_ENV !== "dev") {
                    console.log("SES (prod) sendBookingCancellationEmail", data);
                }
                else {
                    console.log("SES (dev) sendBookingCancellationEmail", data);
                }
            }
            catch (err) {
                console.error("EmailNotificationService sendBookingCancellationEmail (SES)", err);
            }
        });
    }
}
exports.default = EmailNotificationService;
