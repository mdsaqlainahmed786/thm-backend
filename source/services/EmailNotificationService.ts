import { AppConfig } from "../config/constants";
import path from "path";
import fs from "fs/promises";
import { PUBLIC_DIR } from '../middleware/file-uploading';
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
class EmailNotificationService {
    private mailer: MailerSend;
    private sender: Sender;
    constructor() {
        this.mailer = new MailerSend({
            apiKey: AppConfig.MAILER_SEND.API_KEY,
        });
        this.sender = new Sender(AppConfig.MAILER_SEND.FROM_ADDRESS, AppConfig.APP_NAME);
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
            const recipients = [
                new Recipient(toAddress)
            ];
            const emailParams = new EmailParams()
                .setFrom(this.sender)
                .setTo(recipients)
                .setReplyTo(this.sender)
                .setSubject(subject)
                .setHtml(mailHtmlBody)
                .setText(mailTextBody);
            if (AppConfig.APP_ENV !== "dev") {
                await this.mailer.email.send(emailParams);
            } else {
                console.log(emailParams);
            }
        } catch (error) {
            console.error("EmailNotificationService sendEmailOTP", error)
        }
    }
    async verifyEmailTemplate(otp: number) {
        const privacyPolicyLink = '/privacy-policy';
        const termsAndConditions = '/terms-and-conditions';
        const fileData = await this.readTemplate('/template/verify-email.html');
        const base64Logo = await this.readLogo();
        const replacedData = fileData
            .replace(/{{OTP}}/g, otp.toString())
            .replace(/{{Logo}}/g, `data:image/png;base64,${base64Logo}`)
            .replace(/{{PrivacyPolicyLink}}/g, privacyPolicyLink)
            .replace(/{{TermsAndConditions}}/g, termsAndConditions)
            .replace(/{{AppName}}/g, AppConfig.APP_NAME);
        return replacedData;
    }
    async forgotPasswordTemplate(otp: number) {
        const privacyPolicyLink = '/privacy-policy';
        const termsAndConditions = '/terms-and-conditions';
        const fileData = await this.readTemplate('/template/forgot-password.html');
        const base64Logo = await this.readLogo();
        const replacedData = fileData
            .replace(/{{OTP}}/g, otp.toString())
            .replace(/{{Logo}}/g, `data:image/png;base64,${base64Logo}`)
            .replace(/{{PrivacyPolicyLink}}/g, privacyPolicyLink)
            .replace(/{{TermsAndConditions}}/g, termsAndConditions)
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