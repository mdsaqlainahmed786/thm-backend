import { Document, Schema, model } from "mongoose";
import { MongoID } from "../../common";

export interface IMenu extends Document {
    businessProfileID: MongoID;
    userID: MongoID;
    mediaID: MongoID;
    createdAt: Date;
    updatedAt: Date;
}

const MenuSchema: Schema = new Schema<IMenu>(
    {
        businessProfileID: {
            type: Schema.Types.ObjectId,
            ref: "BusinessProfile",
            required: true,
        },
        userID: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        mediaID: {
            type: Schema.Types.ObjectId,
            ref: "Media",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

MenuSchema.set("toObject", { virtuals: true });
MenuSchema.set("toJSON", { virtuals: true });

const Menu = model<IMenu>("Menu", MenuSchema);
export default Menu;


