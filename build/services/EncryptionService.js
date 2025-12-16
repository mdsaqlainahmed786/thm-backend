"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const constants_1 = require("../config/constants");
class EncryptionService {
    constructor() {
        this.key = constants_1.AppConfig.ENCRYPTION.SECRET_KEY;
        this.iv = constants_1.AppConfig.ENCRYPTION.IV;
        this.algorithm = constants_1.AppConfig.ENCRYPTION.ALGORITHM;
    }
    encrypt(data) {
        const cipher = crypto_1.default.createCipheriv(this.algorithm, Buffer.from(this.key), Buffer.from(this.iv));
        let encrypted = cipher.update(data, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        // URL-safe Base64 encoding
        return encrypted.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    decrypt(encryptedData) {
        // Convert URL-safe Base64 back to standard Base64
        const base64 = encryptedData.replace(/-/g, '+').replace(/_/g, '/');
        const decipher = crypto_1.default.createDecipheriv(this.algorithm, Buffer.from(this.key), Buffer.from(this.iv));
        let decrypted = decipher.update(base64, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
exports.default = EncryptionService;
