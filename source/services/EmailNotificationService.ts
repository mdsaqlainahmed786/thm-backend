import { verify } from 'jsonwebtoken';
import sgMail, { MailDataRequired } from "@sendgrid/mail";
import { AppConfig } from "../config/constants";
import path from "path";
import fs from "fs/promises";
import { PUBLIC_DIR } from '../middleware/file-uploading';
class EmailNotificationService {
    constructor() {
        sgMail.setApiKey(AppConfig.SENDGRID.API_KEY);
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
                from: {
                    name: AppConfig.APP_NAME,
                    email: AppConfig.SENDGRID.FROM_ADDRESS
                },
                subject: subject,
                text: mailTextBody,
                html: mailHtmlBody
            };
            if (AppConfig.APP_ENV !== "dev") {
                await sgMail.send(mailData);
            } else {
                console.log(mailData);
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