import { Schema, Document, model, Types } from "mongoose";

export interface IPasswordResetToken extends Document {
    userID: Types.ObjectId | string;
    token: string;
    expiresIn: Date;
}
const PasswordResetTokenSchema: Schema = new Schema<IPasswordResetToken>(
    {
        userID: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        token: { type: String, required: true },
        expiresIn: { type: Date, required: true }
    },
    {
        timestamps: true
    }
);
PasswordResetTokenSchema.set('toObject', { virtuals: true });
PasswordResetTokenSchema.set('toJSON', { virtuals: true });

export interface IPasswordResetTokenModel extends IPasswordResetToken {
}

const PasswordResetToken = model<IPasswordResetToken>('PasswordResetToken', PasswordResetTokenSchema);
export default PasswordResetToken;