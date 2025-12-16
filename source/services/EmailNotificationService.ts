import { AppConfig } from "../config/constants";
import path from "path";
import fs from "fs/promises";
import { PUBLIC_DIR } from "../middleware/file-uploading";
import { SESClient, SendEmailCommand, SendEmailCommandInput } from "@aws-sdk/client-ses";
import moment from "moment";
import { BookingType } from "../database/models/booking.model";

interface SubscriptionEmail {
  name: string;
  toAddress: string;
  cc: string[];
  subscriptionName: string;
  orderID: string;
  purchaseDate: string;
  grandTotal: string;
  transactionID: string;
  paymentMethod: string;
}

class EmailNotificationService {
  private sesClient: SESClient;
  private fromAddress: string;
  private privacyPolicyLink = "https://thehotelmedia.com/privacy-policy";
  private termsAndConditions = "https://thehotelmedia.com/terms-and-conditions";

  constructor() {
    this.sesClient = new SESClient({
      region: AppConfig.SES.REGION,
      // In production prefer IAM role. For local dev using env keys, the SDK will pick up
      // AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY automatically. If you want explicit:
      credentials: { accessKeyId: AppConfig.SES.ACCESS_KEY_ID, secretAccessKey: AppConfig.SES.SECRET_ACCESS_KEY }
    });
    this.fromAddress = AppConfig.SES.FROM_ADDRESS;
  }

  async sendEmailOTP(otp: number, toAddress: string, reason: "verify-email" | "forgot-password") {
    try {
      let subject = "";
      let textBody = "";
      let htmlBody = "";

      if (reason === "verify-email") {
        subject = "Verify your email address";
        textBody = `Hi there,\nTo complete your registration, please use this OTP: ${otp}. Do not share it.`;
        htmlBody = await this.verifyEmailTemplate(otp);
      } else {
        subject = "Password reset request";
        textBody = `Use this OTP to reset your password: ${otp}.`;
        htmlBody = await this.forgotPasswordTemplate(otp);
      }

      const params: SendEmailCommandInput = {
        Source: `${AppConfig.APP_NAME} <${this.fromAddress}>`,
        Destination: { ToAddresses: [toAddress] },
        Message: {
          Subject: { Data: subject },
          Body: { Text: { Data: textBody }, Html: { Data: htmlBody } }
        }
      };

      if (AppConfig.APP_ENV !== "dev") {
        const command = new SendEmailCommand({
          ...params,
          ConfigurationSetName: undefined,
        });
        await this.sesClient.send(command);
      } else {
        console.log("SES (dev) sendEmailOTP", params);
      }
    } catch (err) {
      console.error("EmailNotificationService sendEmailOTP (SES)", err);
    }
  }

  async sendSubscriptionEmail(data: SubscriptionEmail) {
    try {
      const { toAddress, name, cc, subscriptionName, orderID, purchaseDate, grandTotal, transactionID, paymentMethod } = data;
      const subject = "Subscription Purchased";
      const textBody = `Hello ${name},\nThank you for purchasing the ${subscriptionName} subscription! Order: ${orderID}`;
      const htmlBody = await this.subscriptionEmailTemplate(name, subscriptionName, orderID, purchaseDate, grandTotal, transactionID, paymentMethod);

      const ccUnique = cc.filter(e => e && e !== toAddress);

      const params: SendEmailCommandInput = {
        Source: `${AppConfig.APP_NAME} <${this.fromAddress}>`,
        Destination: { ToAddresses: [toAddress], CcAddresses: ccUnique },
        Message: {
          Subject: { Data: subject },
          Body: { Text: { Data: textBody }, Html: { Data: htmlBody } }
        }
      };

      if (AppConfig.APP_ENV !== "dev") {
        const command = new SendEmailCommand({
          ...params,
          ConfigurationSetName: undefined,
        });
        await this.sesClient.send(command);
      } else {
        console.log("SES (dev) sendSubscriptionEmail", params);
      }
    } catch (err) {
      console.error("EmailNotificationService sendSubscriptionEmail (SES)", err);
    }
  }

  // --- template helpers (unchanged, using your files)
  async subscriptionEmailTemplate(name: string, subscriptionName: string, orderID: string, purchaseDate: string, grandTotal: string, transactionID: string, paymentMethod: string) {
    const fileData = await this.readTemplate("/template/subscription.html");
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
      .replace(/{{AppName}}/g, AppConfig.APP_NAME);
  }

  async verifyEmailTemplate(otp: number) {
    const fileData = await this.readTemplate("/template/verify-email.html");
    return fileData.replace(/{{OTP}}/g, otp.toString()).replace(/{{Logo}}/g, `https://thehotelmedia.com/public/files/thm-logo-md.png`).replace(/{{AppName}}/g, AppConfig.APP_NAME);
  }

  async forgotPasswordTemplate(otp: number) {
    const fileData = await this.readTemplate("/template/forgot-password.html");
    return fileData.replace(/{{OTP}}/g, otp.toString()).replace(/{{Logo}}/g, `https://thehotelmedia.com/public/files/thm-logo-md.png`).replace(/{{AppName}}/g, AppConfig.APP_NAME);
  }

  async newBookingEmailTemplate(templateName: string, data: any) {
    const fileData = await this.readTemplate(`/template/${templateName}`);
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
      .replace(/{{AppName}}/g, AppConfig.APP_NAME);
  }

  async confirmBookingEmailTemplate(templateName: string, data: any) {
    const fileData = await this.readTemplate(`/template/${templateName}`);
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
      .replace(/{{HotelAddressLine1}}/g, data.address?.street || "")
      .replace(/{{City}}/g, data.address?.city || "")
      .replace(/{{State}}/g, data.address?.state || "")
      .replace(/{{ZIPCode}}/g, data.address?.zipCode || "")
      .replace(/{{PrivacyPolicyLink}}/g, this.privacyPolicyLink)
      .replace(/{{TermsAndConditions}}/g, this.termsAndConditions)
      .replace(/{{AppName}}/g, AppConfig.APP_NAME);
  }

  async cancelBookingEmailTemplate(templateName: string, data: any) {
    const fileData = await this.readTemplate(`/template/${templateName}`);
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
      .replace(/{{AppName}}/g, AppConfig.APP_NAME);
  }



  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async readTemplate(templatePath: string) {
    // Normalize incoming path (remove leading slash)
    const cleaned = templatePath.startsWith('/') ? templatePath.slice(1) : templatePath;

    const candidates = [
      // Try relative to current file location (works when compiled)
      path.join(__dirname, cleaned),                      // e.g. build/services/template/verify-email.html
      // Try in build directory with services path
      path.join(process.cwd(), 'build', 'services', cleaned),  // e.g. CWD/build/services/template/verify-email.html
      // Try in build directory directly
      path.join(process.cwd(), 'build', cleaned),         // e.g. CWD/build/template/verify-email.html
      // Try in source directory with services path (for development)
      path.join(process.cwd(), 'source', 'services', cleaned), // e.g. CWD/source/services/template/verify-email.html
      // Try in source directory (alternative naming)
      path.join(process.cwd(), 'src', 'services', cleaned),    // e.g. CWD/src/services/template/verify-email.html
      // Try in current working directory
      path.join(process.cwd(), cleaned),                  // e.g. CWD/services/template/verify-email.html
      // Try in source/src directory
      path.join(process.cwd(), 'src', cleaned),           // e.g. CWD/src/services/template/verify-email.html
      // Fallback: try removing template prefix if present
      path.join(__dirname, cleaned.replace(/^template[\\/]/, '')), // fallback
      path.join(process.cwd(), 'template', cleaned),      // e.g. CWD/template/verify-email.html
    ].map(p => path.normalize(p));

    for (const p of candidates) {
      if (await this.fileExists(p)) {
        return await fs.readFile(p, 'utf-8');
      }
    }

    // If none found, throw with useful message
    throw new Error(`Template not found. Tried these paths:\n${candidates.join('\n')}`);
  }

  async readLogo() {
    // PUBLIC_DIR may be absolute or relative. Try common locations.
    const logoCandidates = [
      // If PUBLIC_DIR is set and points to folder

      AppConfig.PUBLIC_DIR ? path.join(AppConfig.PUBLIC_DIR, 'thm-logo.png') : null,
      path.join(__dirname, '..', '..', 'public', 'files', 'thm-logo.png'), // build/services -> build/public/files/...
      path.join(process.cwd(), 'public', 'files', 'thm-logo.png'),
      path.join(process.cwd(), 'build', 'public', 'files', 'thm-logo.png'),
      path.join(process.cwd(), 'public', 'thm-logo.png'),
      path.join(process.cwd(), 'build', 'public', 'thm-logo.png'),
    ].filter(Boolean) as string[];

    for (const p of logoCandidates) {
      if (await this.fileExists(p)) {
        const logoData = await fs.readFile(p);
        return logoData.toString('base64');
      }
    }

    // Not fatal — return empty string or a small fallback so templates still render
    console.warn('Logo not found. Tried paths:\n' + logoCandidates.join('\n'));
    return '';
  }

  async sendBookingEmail(data: any) {
    try {
      const {
        type,
        toAddress,
        cc,
        businessName,
        businessType,
        customerName,
        customerEmail,
        customerPhone,
        checkIn,
        checkOut,
        nights,
        roomType,
        bookingID,
        adults,
        children,
        transactionAmount,
        transactionID,
        paymentMethod,
        transactionDate,
        metadata,
        address
      } = data;

      if (!toAddress) {
        console.warn("EmailNotificationService sendBookingEmail: No toAddress provided");
        return;
      }

      // Determine template based on booking type
      let templateName = "";
      let subject = "";

      if (type === BookingType.BOOK_TABLE) {
        templateName = "new-table-booking.html";
        subject = `New Table Booking Request - ${businessName}`;
      } else if (type === BookingType.BOOK_BANQUET) {
        templateName = "new-banquet-booking.html";
        subject = `New Banquet Booking Request - ${businessName}`;
      } else if (type === BookingType.BOOKING) {
        templateName = "new-hotel-booking.html";
        subject = `New Hotel Booking Request - ${businessName}`;
      } else {
        console.warn(`EmailNotificationService sendBookingEmail: Unknown booking type: ${type}`);
        return;
      }

      // Format dates
      const checkInDate = checkIn ? moment(checkIn).format('ddd DD, MMM YYYY hh:mm A') : "";
      const checkOutDate = checkOut ? moment(checkOut).format('ddd DD, MMM YYYY hh:mm A') : "";
      const numberOfGuests = (adults || 0) + (children || 0);

      // Generate HTML body
      const htmlBody = await this.newBookingEmailTemplate(templateName, {
        businessName: businessName || "",
        businessType: businessType || "",
        customerName: customerName || "",
        customerEmail: customerEmail || "",
        customerPhone: customerPhone || "",
        checkInDate,
        checkOutDate,
        numberOfGuests: numberOfGuests.toString(),
        bookingID: bookingID || "",
        nights: nights?.toString() || "0",
        roomType: roomType || "",
        transactionAmount: transactionAmount ? `$${transactionAmount.toFixed(2)}` : "$0.00",
        transactionID: transactionID || "",
        paymentMethod: paymentMethod || "",
        transactionDate: transactionDate || "",
        eventType: metadata?.typeOfEvent || ""
      });

      const textBody = `New booking request: ${customerName} has requested a booking at ${businessName} for ${checkInDate}. Booking ID: ${bookingID}`;

      const ccUnique = (cc || []).filter((e: string) => e && e !== toAddress && e.trim() !== "");

      const params: SendEmailCommandInput = {
        Source: `${AppConfig.APP_NAME} <${this.fromAddress}>`,
        Destination: {
          ToAddresses: [toAddress],
          CcAddresses: ccUnique.length > 0 ? ccUnique : undefined
        },
        Message: {
          Subject: { Data: subject },
          Body: { Text: { Data: textBody }, Html: { Data: htmlBody } }
        }
      };

      if (AppConfig.APP_ENV !== "dev") {
        const command = new SendEmailCommand(params);
        await this.sesClient.send(command);
        console.log(`EmailNotificationService sendBookingEmail: Email sent to ${toAddress} for booking ${bookingID}`);
      } else {
        console.log("SES (dev) sendBookingEmail", params);
      }
    } catch (err) {
      console.error("EmailNotificationService sendBookingEmail (SES)", err);
    }
  }

  async sendBookingConfirmationEmail(data: any) {
    try {
      const {
        type,
        toAddress,
        cc,
        businessName,
        businessType,
        businessPhone,
        businessEmail,
        customerName,
        customerEmail,
        customerPhone,
        checkIn,
        checkOut,
        nights,
        roomType,
        bookingID,
        adults,
        children,
        transactionAmount,
        transactionID,
        paymentMethod,
        transactionDate,
        metadata,
        address
      } = data;

      if (!toAddress) {
        console.warn("EmailNotificationService sendBookingConfirmationEmail: No toAddress provided");
        return;
      }

      // Determine template based on booking type
      let templateName = "";
      let subject = "";

      if (type === BookingType.BOOK_TABLE) {
        templateName = "confirm-table-booking.html";
        subject = `Table Booking Confirmed - ${businessName}`;
      } else if (type === BookingType.BOOK_BANQUET) {
        templateName = "confirm-banquet-booking.html";
        subject = `Banquet Booking Confirmed - ${businessName}`;
      } else if (type === BookingType.BOOKING) {
        templateName = "confirm-hotel-booking.html";
        subject = `Hotel Booking Confirmed - ${businessName}`;
      } else {
        console.warn(`EmailNotificationService sendBookingConfirmationEmail: Unknown booking type: ${type}`);
        return;
      }

      // Format dates
      const checkInDate = checkIn ? moment(checkIn).format('ddd DD, MMM YYYY hh:mm A') : "";
      const checkOutDate = checkOut ? moment(checkOut).format('ddd DD, MMM YYYY hh:mm A') : "";
      const numberOfGuests = (adults || 0) + (children || 0);

      // Generate HTML body
      const htmlBody = await this.confirmBookingEmailTemplate(templateName, {
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
        nights: nights?.toString() || "0",
        roomType: roomType || "",
        transactionAmount: transactionAmount ? `$${transactionAmount.toFixed(2)}` : "$0.00",
        transactionID: transactionID || "",
        paymentMethod: paymentMethod || "",
        transactionDate: transactionDate || "",
        eventType: metadata?.typeOfEvent || "",
        address: address || {}
      });

      const textBody = `Booking Confirmed: Your booking at ${businessName} is confirmed for ${checkInDate}. Booking ID: ${bookingID}`;

      const ccUnique = (cc || []).filter((e: string) => e && e !== toAddress && e.trim() !== "");

      const params: SendEmailCommandInput = {
        Source: `${AppConfig.APP_NAME} <${this.fromAddress}>`,
        Destination: {
          ToAddresses: [toAddress],
          CcAddresses: ccUnique.length > 0 ? ccUnique : undefined
        },
        Message: {
          Subject: { Data: subject },
          Body: { Text: { Data: textBody }, Html: { Data: htmlBody } }
        }
      };

      if (AppConfig.APP_ENV !== "dev") {
        const command = new SendEmailCommand(params);
        await this.sesClient.send(command);
        console.log(`EmailNotificationService sendBookingConfirmationEmail: Email sent to ${toAddress} for booking ${bookingID}`);
      } else {
        console.log("SES (dev) sendBookingConfirmationEmail", params);
      }
    } catch (err) {
      console.error("EmailNotificationService sendBookingConfirmationEmail (SES)", err);
    }
  }

  async sendBookingCancellationEmail(data: any) {
    try {
      const {
        type,
        toAddress,
        cc,
        businessName,
        businessPhone,
        businessEmail,
        customerName,
        customerEmail,
        customerPhone,
        checkIn,
        checkOut,
        nights,
        roomType,
        bookingID,
        adults,
        children,
        metadata
      } = data;

      if (!toAddress) {
        console.warn("EmailNotificationService sendBookingCancellationEmail: No toAddress provided");
        return;
      }

      // Determine template based on booking type
      let templateName = "";
      let subject = "";

      if (type === BookingType.BOOK_TABLE) {
        templateName = "cancel-table-booking.html";
        subject = `Table Booking Cancelled - ${businessName}`;
      } else if (type === BookingType.BOOK_BANQUET) {
        templateName = "cancel-banquet-booking.html";
        subject = `Banquet Booking Cancelled - ${businessName}`;
      } else if (type === BookingType.BOOKING) {
        templateName = "cancel-hotel-booking.html";
        subject = `Hotel Booking Cancelled - ${businessName}`;
      } else {
        console.warn(`EmailNotificationService sendBookingCancellationEmail: Unknown booking type: ${type}`);
        return;
      }

      // Format dates
      const checkInDate = checkIn ? moment(checkIn).format('ddd DD, MMM YYYY hh:mm A') : "";
      const numberOfGuests = (adults || 0) + (children || 0);

      // Generate HTML body
      const htmlBody = await this.cancelBookingEmailTemplate(templateName, {
        businessName: businessName || "",
        businessPhone: businessPhone || "",
        businessEmail: businessEmail || "",
        customerName: customerName || "",
        customerEmail: customerEmail || "",
        customerPhone: customerPhone || "",
        checkInDate,
        numberOfGuests: numberOfGuests.toString(),
        bookingID: bookingID || "",
        nights: nights?.toString() || "0",
        roomType: roomType || "",
        eventType: metadata?.typeOfEvent || ""
      });

      const textBody = `Booking Cancelled: We regret to inform you that your booking at ${businessName} for ${checkInDate} has been cancelled. Booking ID: ${bookingID}`;

      const ccUnique = (cc || []).filter((e: string) => e && e !== toAddress && e.trim() !== "");

      const params: SendEmailCommandInput = {
        Source: `${AppConfig.APP_NAME} <${this.fromAddress}>`,
        Destination: {
          ToAddresses: [toAddress],
          CcAddresses: ccUnique.length > 0 ? ccUnique : undefined
        },
        Message: {
          Subject: { Data: subject },
          Body: { Text: { Data: textBody }, Html: { Data: htmlBody } }
        }
      };

      if (AppConfig.APP_ENV !== "dev") {
        const command = new SendEmailCommand(params);
        await this.sesClient.send(command);
        console.log(`EmailNotificationService sendBookingCancellationEmail: Email sent to ${toAddress} for booking ${bookingID}`);
      } else {
        console.log("SES (dev) sendBookingCancellationEmail", params);
      }
    } catch (err) {
      console.error("EmailNotificationService sendBookingCancellationEmail (SES)", err);
    }
  }

}

export default EmailNotificationService;
