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
const moment_1 = __importDefault(require("moment"));
const booking_model_1 = require("../database/models/booking.model");
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
    newBookingEmailTemplate(templateName, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileData = yield this.readTemplate(`/template/${templateName}`);
            return fileData
                .replace(/{{Logo}}/g, `https://thehotelmedia.com/public/files/thm-logo-md.png`)
                .replace(/{{BusinessName}}/g, data.businessName || "")
                .replace(/{{BusinessType}}/g, data.businessType || "")
                .replace(/{{CustomerName}}/g, data.customerName || "")
                .replace(/{{CustomerEmail}}/g, data.customerEmail || "")
                .replace(/{{CustomerPhone}}/g, data.customerPhone || "")
                .replace(/{{CheckInDate}}/g, data.checkInDate || "")
                .replace(/{{CheckOutDate}}/g, data.checkOutDate || "")
                .replace(/{{NumberOfGuests}}/g, data.numberOfGuests || "0")
                .replace(/{{BookingID}}/g, data.bookingID || "")
                .replace(/{{Nights}}/g, data.nights || "0")
                .replace(/{{RoomType}}/g, data.roomType || "")
                .replace(/{{TransactionAmount}}/g, data.transactionAmount || "$0.00")
                .replace(/{{TransactionID}}/g, data.transactionID || "")
                .replace(/{{PaymentMethod}}/g, data.paymentMethod || "")
                .replace(/{{TransactionDate}}/g, data.transactionDate || "")
                .replace(/{{EventType}}/g, data.eventType || "")
                .replace(/{{PhoneNumber}}/g, data.customerPhone || "")
                .replace(/{{EmailAddress}}/g, data.customerEmail || "")
                .replace(/{{PrivacyPolicyLink}}/g, this.privacyPolicyLink)
                .replace(/{{TermsAndConditions}}/g, this.termsAndConditions)
                .replace(/{{AppName}}/g, constants_1.AppConfig.APP_NAME);
        });
    }
    confirmBookingEmailTemplate(templateName, data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const fileData = yield this.readTemplate(`/template/${templateName}`);
            return fileData
                .replace(/{{Logo}}/g, `https://thehotelmedia.com/public/files/thm-logo-md.png`)
                .replace(/{{BusinessName}}/g, data.businessName || "")
                .replace(/{{BusinessType}}/g, data.businessType || "")
                .replace(/{{BusinessPhone}}/g, data.businessPhone || "")
                .replace(/{{BusinessEmail}}/g, data.businessEmail || "")
                .replace(/{{CustomerName}}/g, data.customerName || "")
                .replace(/{{CustomerEmail}}/g, data.customerEmail || "")
                .replace(/{{CustomerPhone}}/g, data.customerPhone || "")
                .replace(/{{CheckInDate}}/g, data.checkInDate || "")
                .replace(/{{CheckOutDate}}/g, data.checkOutDate || "")
                .replace(/{{NumberOfGuests}}/g, data.numberOfGuests || "0")
                .replace(/{{BookingID}}/g, data.bookingID || "")
                .replace(/{{Nights}}/g, data.nights || "0")
                .replace(/{{RoomType}}/g, data.roomType || "")
                .replace(/{{TransactionAmount}}/g, data.transactionAmount || "$0.00")
                .replace(/{{TransactionID}}/g, data.transactionID || "")
                .replace(/{{PaymentMethod}}/g, data.paymentMethod || "")
                .replace(/{{TransactionDate}}/g, data.transactionDate || "")
                .replace(/{{EventType}}/g, data.eventType || "")
                .replace(/{{HotelAddressLine1}}/g, ((_a = data.address) === null || _a === void 0 ? void 0 : _a.street) || "")
                .replace(/{{City}}/g, ((_b = data.address) === null || _b === void 0 ? void 0 : _b.city) || "")
                .replace(/{{State}}/g, ((_c = data.address) === null || _c === void 0 ? void 0 : _c.state) || "")
                .replace(/{{ZIPCode}}/g, ((_d = data.address) === null || _d === void 0 ? void 0 : _d.zipCode) || "")
                .replace(/{{PrivacyPolicyLink}}/g, this.privacyPolicyLink)
                .replace(/{{TermsAndConditions}}/g, this.termsAndConditions)
                .replace(/{{AppName}}/g, constants_1.AppConfig.APP_NAME);
        });
    }
    cancelBookingEmailTemplate(templateName, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileData = yield this.readTemplate(`/template/${templateName}`);
            return fileData
                .replace(/{{Logo}}/g, `https://thehotelmedia.com/public/files/thm-logo-md.png`)
                .replace(/{{BusinessName}}/g, data.businessName || "")
                .replace(/{{BusinessPhone}}/g, data.businessPhone || "")
                .replace(/{{BusinessEmail}}/g, data.businessEmail || "")
                .replace(/{{CustomerName}}/g, data.customerName || "")
                .replace(/{{CustomerEmail}}/g, data.customerEmail || "")
                .replace(/{{CustomerPhone}}/g, data.customerPhone || "")
                .replace(/{{CheckInDate}}/g, data.checkInDate || "")
                .replace(/{{NumberOfGuests}}/g, data.numberOfGuests || "0")
                .replace(/{{BookingID}}/g, data.bookingID || "")
                .replace(/{{Nights}}/g, data.nights || "0")
                .replace(/{{RoomType}}/g, data.roomType || "")
                .replace(/{{EventType}}/g, data.eventType || "")
                .replace(/{{PrivacyPolicyLink}}/g, this.privacyPolicyLink)
                .replace(/{{TermsAndConditions}}/g, this.termsAndConditions)
                .replace(/{{AppName}}/g, constants_1.AppConfig.APP_NAME);
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
                // Try relative to current file location (works when compiled)
                path_1.default.join(__dirname, cleaned), // e.g. build/services/template/verify-email.html
                // Try in build directory with services path
                path_1.default.join(process.cwd(), 'build', 'services', cleaned), // e.g. CWD/build/services/template/verify-email.html
                // Try in build directory directly
                path_1.default.join(process.cwd(), 'build', cleaned), // e.g. CWD/build/template/verify-email.html
                // Try in source directory with services path (for development)
                path_1.default.join(process.cwd(), 'source', 'services', cleaned), // e.g. CWD/source/services/template/verify-email.html
                // Try in source directory (alternative naming)
                path_1.default.join(process.cwd(), 'src', 'services', cleaned), // e.g. CWD/src/services/template/verify-email.html
                // Try in current working directory
                path_1.default.join(process.cwd(), cleaned), // e.g. CWD/services/template/verify-email.html
                // Try in source/src directory
                path_1.default.join(process.cwd(), 'src', cleaned), // e.g. CWD/src/services/template/verify-email.html
                // Fallback: try removing template prefix if present
                path_1.default.join(__dirname, cleaned.replace(/^template[\\/]/, '')), // fallback
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
                const { type, toAddress, cc, businessName, businessType, customerName, customerEmail, customerPhone, checkIn, checkOut, nights, roomType, bookingID, adults, children, transactionAmount, transactionID, paymentMethod, transactionDate, metadata, address } = data;
                if (!toAddress) {
                    console.warn("EmailNotificationService sendBookingEmail: No toAddress provided");
                    return;
                }
                // Determine template based on booking type
                let templateName = "";
                let subject = "";
                if (type === booking_model_1.BookingType.BOOK_TABLE) {
                    templateName = "new-table-booking.html";
                    subject = `New Table Booking Request - ${businessName}`;
                }
                else if (type === booking_model_1.BookingType.BOOK_BANQUET) {
                    templateName = "new-banquet-booking.html";
                    subject = `New Banquet Booking Request - ${businessName}`;
                }
                else if (type === booking_model_1.BookingType.BOOKING) {
                    templateName = "new-hotel-booking.html";
                    subject = `New Hotel Booking Request - ${businessName}`;
                }
                else {
                    console.warn(`EmailNotificationService sendBookingEmail: Unknown booking type: ${type}`);
                    return;
                }
                // Format dates
                const checkInDate = checkIn ? (0, moment_1.default)(checkIn).format('ddd DD, MMM YYYY hh:mm A') : "";
                const checkOutDate = checkOut ? (0, moment_1.default)(checkOut).format('ddd DD, MMM YYYY hh:mm A') : "";
                const numberOfGuests = (adults || 0) + (children || 0);
                // Generate HTML body
                const htmlBody = yield this.newBookingEmailTemplate(templateName, {
                    businessName: businessName || "",
                    businessType: businessType || "",
                    customerName: customerName || "",
                    customerEmail: customerEmail || "",
                    customerPhone: customerPhone || "",
                    checkInDate,
                    checkOutDate,
                    numberOfGuests: numberOfGuests.toString(),
                    bookingID: bookingID || "",
                    nights: (nights === null || nights === void 0 ? void 0 : nights.toString()) || "0",
                    roomType: roomType || "",
                    transactionAmount: transactionAmount ? `$${transactionAmount.toFixed(2)}` : "$0.00",
                    transactionID: transactionID || "",
                    paymentMethod: paymentMethod || "",
                    transactionDate: transactionDate || "",
                    eventType: (metadata === null || metadata === void 0 ? void 0 : metadata.typeOfEvent) || ""
                });
                const textBody = `New booking request: ${customerName} has requested a booking at ${businessName} for ${checkInDate}. Booking ID: ${bookingID}`;
                const ccUnique = (cc || []).filter((e) => e && e !== toAddress && e.trim() !== "");
                const params = {
                    Source: `${constants_1.AppConfig.APP_NAME} <${this.fromAddress}>`,
                    Destination: {
                        ToAddresses: [toAddress],
                        CcAddresses: ccUnique.length > 0 ? ccUnique : undefined
                    },
                    Message: {
                        Subject: { Data: subject },
                        Body: { Text: { Data: textBody }, Html: { Data: htmlBody } }
                    }
                };
                if (constants_1.AppConfig.APP_ENV !== "dev") {
                    const command = new client_ses_1.SendEmailCommand(params);
                    yield this.sesClient.send(command);
                    console.log(`EmailNotificationService sendBookingEmail: Email sent to ${toAddress} for booking ${bookingID}`);
                }
                else {
                    console.log("SES (dev) sendBookingEmail", params);
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
                const { type, toAddress, cc, businessName, businessType, businessPhone, businessEmail, customerName, customerEmail, customerPhone, checkIn, checkOut, nights, roomType, bookingID, adults, children, transactionAmount, transactionID, paymentMethod, transactionDate, metadata, address } = data;
                if (!toAddress) {
                    console.warn("EmailNotificationService sendBookingConfirmationEmail: No toAddress provided");
                    return;
                }
                // Determine template based on booking type
                let templateName = "";
                let subject = "";
                if (type === booking_model_1.BookingType.BOOK_TABLE) {
                    templateName = "confirm-table-booking.html";
                    subject = `Table Booking Confirmed - ${businessName}`;
                }
                else if (type === booking_model_1.BookingType.BOOK_BANQUET) {
                    templateName = "confirm-banquet-booking.html";
                    subject = `Banquet Booking Confirmed - ${businessName}`;
                }
                else if (type === booking_model_1.BookingType.BOOKING) {
                    templateName = "confirm-hotel-booking.html";
                    subject = `Hotel Booking Confirmed - ${businessName}`;
                }
                else {
                    console.warn(`EmailNotificationService sendBookingConfirmationEmail: Unknown booking type: ${type}`);
                    return;
                }
                // Format dates
                const checkInDate = checkIn ? (0, moment_1.default)(checkIn).format('ddd DD, MMM YYYY hh:mm A') : "";
                const checkOutDate = checkOut ? (0, moment_1.default)(checkOut).format('ddd DD, MMM YYYY hh:mm A') : "";
                const numberOfGuests = (adults || 0) + (children || 0);
                // Generate HTML body
                const htmlBody = yield this.confirmBookingEmailTemplate(templateName, {
                    businessName: businessName || "",
                    businessType: businessType || "",
                    businessPhone: businessPhone || "",
                    businessEmail: businessEmail || "",
                    customerName: customerName || "",
                    customerEmail: customerEmail || "",
                    customerPhone: customerPhone || "",
                    checkInDate,
                    checkOutDate,
                    numberOfGuests: numberOfGuests.toString(),
                    bookingID: bookingID || "",
                    nights: (nights === null || nights === void 0 ? void 0 : nights.toString()) || "0",
                    roomType: roomType || "",
                    transactionAmount: transactionAmount ? `$${transactionAmount.toFixed(2)}` : "$0.00",
                    transactionID: transactionID || "",
                    paymentMethod: paymentMethod || "",
                    transactionDate: transactionDate || "",
                    eventType: (metadata === null || metadata === void 0 ? void 0 : metadata.typeOfEvent) || "",
                    address: address || {}
                });
                const textBody = `Booking Confirmed: Your booking at ${businessName} is confirmed for ${checkInDate}. Booking ID: ${bookingID}`;
                const ccUnique = (cc || []).filter((e) => e && e !== toAddress && e.trim() !== "");
                const params = {
                    Source: `${constants_1.AppConfig.APP_NAME} <${this.fromAddress}>`,
                    Destination: {
                        ToAddresses: [toAddress],
                        CcAddresses: ccUnique.length > 0 ? ccUnique : undefined
                    },
                    Message: {
                        Subject: { Data: subject },
                        Body: { Text: { Data: textBody }, Html: { Data: htmlBody } }
                    }
                };
                if (constants_1.AppConfig.APP_ENV !== "dev") {
                    const command = new client_ses_1.SendEmailCommand(params);
                    yield this.sesClient.send(command);
                    console.log(`EmailNotificationService sendBookingConfirmationEmail: Email sent to ${toAddress} for booking ${bookingID}`);
                }
                else {
                    console.log("SES (dev) sendBookingConfirmationEmail", params);
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
                const { type, toAddress, cc, businessName, businessPhone, businessEmail, customerName, customerEmail, customerPhone, checkIn, checkOut, nights, roomType, bookingID, adults, children, metadata } = data;
                if (!toAddress) {
                    console.warn("EmailNotificationService sendBookingCancellationEmail: No toAddress provided");
                    return;
                }
                // Determine template based on booking type
                let templateName = "";
                let subject = "";
                if (type === booking_model_1.BookingType.BOOK_TABLE) {
                    templateName = "cancel-table-booking.html";
                    subject = `Table Booking Cancelled - ${businessName}`;
                }
                else if (type === booking_model_1.BookingType.BOOK_BANQUET) {
                    templateName = "cancel-banquet-booking.html";
                    subject = `Banquet Booking Cancelled - ${businessName}`;
                }
                else if (type === booking_model_1.BookingType.BOOKING) {
                    templateName = "cancel-hotel-booking.html";
                    subject = `Hotel Booking Cancelled - ${businessName}`;
                }
                else {
                    console.warn(`EmailNotificationService sendBookingCancellationEmail: Unknown booking type: ${type}`);
                    return;
                }
                // Format dates
                const checkInDate = checkIn ? (0, moment_1.default)(checkIn).format('ddd DD, MMM YYYY hh:mm A') : "";
                const numberOfGuests = (adults || 0) + (children || 0);
                // Generate HTML body
                const htmlBody = yield this.cancelBookingEmailTemplate(templateName, {
                    businessName: businessName || "",
                    businessPhone: businessPhone || "",
                    businessEmail: businessEmail || "",
                    customerName: customerName || "",
                    customerEmail: customerEmail || "",
                    customerPhone: customerPhone || "",
                    checkInDate,
                    numberOfGuests: numberOfGuests.toString(),
                    bookingID: bookingID || "",
                    nights: (nights === null || nights === void 0 ? void 0 : nights.toString()) || "0",
                    roomType: roomType || "",
                    eventType: (metadata === null || metadata === void 0 ? void 0 : metadata.typeOfEvent) || ""
                });
                const textBody = `Booking Cancelled: We regret to inform you that your booking at ${businessName} for ${checkInDate} has been cancelled. Booking ID: ${bookingID}`;
                const ccUnique = (cc || []).filter((e) => e && e !== toAddress && e.trim() !== "");
                const params = {
                    Source: `${constants_1.AppConfig.APP_NAME} <${this.fromAddress}>`,
                    Destination: {
                        ToAddresses: [toAddress],
                        CcAddresses: ccUnique.length > 0 ? ccUnique : undefined
                    },
                    Message: {
                        Subject: { Data: subject },
                        Body: { Text: { Data: textBody }, Html: { Data: htmlBody } }
                    }
                };
                if (constants_1.AppConfig.APP_ENV !== "dev") {
                    const command = new client_ses_1.SendEmailCommand(params);
                    yield this.sesClient.send(command);
                    console.log(`EmailNotificationService sendBookingCancellationEmail: Email sent to ${toAddress} for booking ${bookingID}`);
                }
                else {
                    console.log("SES (dev) sendBookingCancellationEmail", params);
                }
            }
            catch (err) {
                console.error("EmailNotificationService sendBookingCancellationEmail (SES)", err);
            }
        });
    }
}
exports.default = EmailNotificationService;
