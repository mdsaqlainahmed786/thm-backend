import { AppConfig } from "../config/constants";
import path from "path";
import fs from "fs/promises";
import { PUBLIC_DIR } from "../middleware/file-uploading";
import { SESClient, SendEmailCommand, SendEmailCommandInput } from "@aws-sdk/client-ses";

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
      path.join(__dirname, cleaned),                      // e.g. build/services/template/verify-email.html
      path.join(process.cwd(), 'build', cleaned),         // e.g. CWD/build/services/template/verify-email.html
      path.join(process.cwd(), cleaned),                  // e.g. CWD/services/template/verify-email.html
      path.join(process.cwd(), 'src', cleaned),           // e.g. CWD/src/services/template/verify-email.html
      path.join(process.cwd(), 'src', 'services', cleaned.replace(/^template[\\/]/, '')), // fallback
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

}

export default EmailNotificationService;
