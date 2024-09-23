import { Schema, Document, model, Types } from "mongoose";

export interface IProfilePic {
    small: string;
    medium: string;
    large: string;
}

export const ProfileSchema: Schema = new Schema<IProfilePic>(
    {
        small: {
            type: String,
            default: ""
        },
        medium: {
            type: String,
            default: ""
        },
        large: {
            type: String,
            default: "",
        }
    },
    {
        _id: false,
    }
);

