import mongoose, { Schema, Types, Document } from 'mongoose';
export interface IContactSupport extends Document {
    name: string;
    email: String;
    subject?: string;
    message: string;
}

const ContactSupportSchema: Schema = new Schema<IContactSupport>(
    {
        name: { type: String, required: true },
        email: {
            type: String, lowercase: true, required: true, match: [/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/]
        },
        subject: { type: String },
        message: { type: String, required: true },
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