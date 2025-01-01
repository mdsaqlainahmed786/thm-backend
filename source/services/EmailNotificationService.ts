import { AppConfig } from "../config/constants";
import path from "path";
import fs from "fs/promises";
import { PUBLIC_DIR } from '../middleware/file-uploading';
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
import moment from "moment";
import sgMail, { MailDataRequired } from "@sendgrid/mail";
import { EmailData } from "@sendgrid/helpers/classes/email-address";
interface SubscriptionEmail {
    name: string
    toAddress: string
    cc: string[]
    subscriptionName: string
    orderID: string
    purchaseDate: string
    grandTotal: string
    transactionID: string
    paymentMethod: string

}

class EmailNotificationService {
    // private mailer: MailerSend;
    // private sender: Sender;
    private fromAddress: EmailData;
    private privacyPolicyLink: string;
    private termsAndConditions: string;
    constructor() {
        // this.mailer = new MailerSend({
        //     apiKey: AppConfig.MAILER_SEND.API_KEY!
        // });
        // this.sender = new Sender(AppConfig.MAILER_SEND.FROM_ADDRESS, AppConfig.APP_NAME);
        sgMail.setApiKey(AppConfig.SENDGRID.API_KEY);
        this.fromAddress = {
            name: AppConfig.APP_NAME,
            email: AppConfig.SENDGRID.FROM_ADDRESS
        }
        this.privacyPolicyLink = 'https://thehotelmedia.com/privacy-policy';
        this.termsAndConditions = 'https://thehotelmedia.com/terms-and-conditions';
    }
    async sendEmailOTP(otp: number, toAddress: string, reason: 'verify-email' | 'forgot-password') {
        try {
            let subject = '';
            let mailTextBody = '';
            let mailHtmlBody = '';
            if (reason === 'verify-email') {
                subject = `Verify your email address`;
                mailTextBody = `Hi there,\n Thank you for signing up! To complete your registration, please verify your email address by entering the OTP:: ${otp}. \n\nDo not share this OTP with anyone for security reasons.`;
                mailHtmlBody = await this.verifyEmailTemplate(otp);
            }
            if (reason === 'forgot-password') {
                subject = `Password reset request`;
                mailTextBody = `You are receiving this email because we received a password reset request for your account. Use ${otp} OTP to recover your account password.`;
                mailHtmlBody = await this.forgotPasswordTemplate(otp);
            }
            const mailData: MailDataRequired = {
                to: toAddress,
                from: this.fromAddress,
                subject: subject,
                text: mailTextBody,
                html: mailHtmlBody
            };
            //FIXME  Remove me
            // const recipients = [
            //     new Recipient(toAddress)
            // ];
            // const emailParams = new EmailParams()
            //     .setFrom(this.sender)
            //     .setTo(recipients)
            //     .setReplyTo(this.sender)
            //     .setSubject(subject)
            //     .setHtml(mailHtmlBody)
            //     .setText(mailTextBody);
            if (AppConfig.APP_ENV !== "dev") {
                // await this.mailer.email.send(emailParams);
                await sgMail.send(mailData);
            } else {
                // console.log(emailParams);
                console.log(mailData);
            }
        } catch (error) {
            console.error("EmailNotificationService sendEmailOTP", error)
        }
    }
    async sendSubscriptionEmail(data: SubscriptionEmail) {
        try {
            const { toAddress, name, cc, subscriptionName, orderID, purchaseDate, grandTotal, transactionID, paymentMethod, } = data;
            let subject = 'Subscription Purchased';
            let mailTextBody = `
                Hello ${name}, \nThank you for purchasing the ${subscriptionName} subscription! \n\nWe are excited to have you with us. If you have any questions or need assistance, feel free to contact us. \n\nBest regards, \n${AppConfig.APP_NAME}
            `;
            let mailHtmlBody = await this.subscriptionEmailTemplate(name, subscriptionName, orderID, purchaseDate, grandTotal, transactionID, paymentMethod,);
            const ccRecipients = cc.filter((email) => email !== toAddress).map((email) => ({ email: email, name: '' }));
            const mailData: MailDataRequired = {
                to: toAddress,
                from: this.fromAddress,
                cc: ccRecipients,
                subject: subject,
                text: mailTextBody,
                html: mailHtmlBody
            };
            // const recipients = [
            //     new Recipient(toAddress, name)
            // ];
            // const ccRecipients = cc.map((email) => new Recipient(email));
            // const emailParams = new EmailParams()
            //     .setFrom(this.sender)
            //     .setTo(recipients)
            //     .setCc(ccRecipients)
            //     .setReplyTo(this.sender)
            //     .setSubject(subject)
            //     .setHtml(mailHtmlBody)
            //     .setText(mailTextBody);
            if (AppConfig.APP_ENV !== "dev") {
                await sgMail.send(mailData);
                // await this.mailer.email.send(emailParams);
            } else {
                // console.log(emailParams);
                console.log(mailData);
            }
        } catch (error: any) {
            console.log(error?.response?.body?.errors);
            console.error("EmailNotificationService sendSubscriptionEmail", error)
        }
    }
    async subscriptionEmailTemplate(name: string, subscriptionName: string, orderID: string, purchaseDate: string, grandTotal: string, transactionID: string, paymentMethod: string) {
        const fileData = await this.readTemplate('/template/subscription.html');
        const base64Logo = await this.readLogo();
        const replacedData = fileData
            .replace(/{{Name}}/g, name)
            .replace(/{{SubscriptionName}}/g, subscriptionName)
            .replace(/{{TransactionID}}/g, transactionID)
            .replace(/{{PaymentMethod}}/g, paymentMethod)
            .replace(/{{OrderID}}/g, orderID)
            .replace(/{{GrandTotal}}/g, grandTotal)
            .replace(/{{PurchaseDate}}/g, purchaseDate)
            // .replace(/{{Logo}}/g, `data:image/png;base64,${base64Logo}`)
            .replace(/{{Logo}}/g, `https://thehotelmedia.com/public/files/thm-logo-md.png`)
            .replace(/{{PrivacyPolicyLink}}/g, this.privacyPolicyLink)
            .replace(/{{TermsAndConditions}}/g, this.termsAndConditions)
            .replace(/{{AppName}}/g, AppConfig.APP_NAME);
        return replacedData;
    }
    async verifyEmailTemplate(otp: number) {
        const fileData = await this.readTemplate('/template/verify-email.html');
        const base64Logo = await this.readLogo();
        const replacedData = fileData
            .replace(/{{OTP}}/g, otp.toString())
            // .replace(/{{Logo}}/g, `data:image/png;base64,${base64Logo}`)
            .replace(/{{Logo}}/g, `https://thehotelmedia.com/public/files/thm-logo-md.png`)
            .replace(/{{PrivacyPolicyLink}}/g, this.privacyPolicyLink)
            .replace(/{{TermsAndConditions}}/g, this.termsAndConditions)
            .replace(/{{AppName}}/g, AppConfig.APP_NAME);
        return replacedData;
    }
    async forgotPasswordTemplate(otp: number) {
        const fileData = await this.readTemplate('/template/forgot-password.html');
        const base64Logo = await this.readLogo();
        const replacedData = fileData
            .replace(/{{OTP}}/g, otp.toString())
            // .replace(/{{Logo}}/g, `data:image/png;base64,${base64Logo}`)
            .replace(/{{Logo}}/g, `https://thehotelmedia.com/public/files/thm-logo-md.png`)
            .replace(/{{PrivacyPolicyLink}}/g, this.privacyPolicyLink)
            .replace(/{{TermsAndConditions}}/g, this.termsAndConditions)
            .replace(/{{AppName}}/g, AppConfig.APP_NAME);
        return replacedData;
    }
    async readLogo() {
        const logoData = await fs.readFile(`${PUBLIC_DIR}/thm-logo.png`);
        return logoData.toString('base64');
    }
    async readTemplate(templatePath: string) {
        const filePath = path.join(__dirname, templatePath);
        return await fs.readFile(filePath, 'utf-8');
    }
}


export default EmailNotificationService;