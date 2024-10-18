import mongoose, { Schema, Types, Document } from 'mongoose';
export interface IContactSupport extends Document {
    name: string;
    email: String;
    // phoneNumber: String;
    // dialCode: String;
    // role: Role;
    subject?: string;
    message: string;
    // attachments: string[];
    // location?: string;
    // orderNumber?: string;
    // preferredContactMethod: "email" | "phone";
    // newsletterSubscription: boolean;
}

const ContactSupportSchema: Schema = new Schema<IContactSupport>(
    {
        name: { type: String, required: true },
        email: {
            type: String, lowercase: true, required: true, match: [/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/]
        },
        // phoneNumber: {
        //     type: String, required: true, match: [/^\d{1,14}$/]
        // },
        // dialCode: {
        //     type: String, required: true, match: [/^\+\d{1,3}$/],
        // },
        // role: { type: String, enum: Role, default: Role.USER },
        subject: { type: String },
        message: { type: String, required: true },
        // attachments: [{ type: String }],
        // location: { type: String },
        // orderNumber: { type: String },
        // preferredContactMethod: { type: String, enum: ["email", "phone"] },
        // newsletterSubscription: { type: Boolean, default: false },
    },
    {
        timestamps: true
    }
);
ContactSupportSchema.set('toObject', { virtuals: true });
ContactSupportSchema.set('toJSON', { virtuals: true });

export interface IContactSupportModel extends IContactSupport {

}
const ContactSupport = mongoose.model<IContactSupportModel>('ContactSupport', ContactSupportSchema);
export default ContactSupport;