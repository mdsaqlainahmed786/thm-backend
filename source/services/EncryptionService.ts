import crypto from "crypto";
import { AppConfig } from "../config/constants";
class EncryptionService {
    private key: string;
    private iv: string;
    private algorithm: string;

    constructor() {
        this.key = AppConfig.ENCRYPTION.SECRET_KEY;
        this.iv = AppConfig.ENCRYPTION.IV;
        this.algorithm = AppConfig.ENCRYPTION.ALGORITHM;
    }

    public encrypt(data: string): string {
        const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.key), Buffer.from(this.iv));
        let encrypted = cipher.update(data, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        // URL-safe Base64 encoding
        return encrypted.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') as string;
    }

    public decrypt(encryptedData: string): string {
        // Convert URL-safe Base64 back to standard Base64
        const base64 = encryptedData.replace(/-/g, '+').replace(/_/g, '/');
        const decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(this.key), Buffer.from(this.iv));
        let decrypted = decipher.update(base64, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
export default EncryptionService;