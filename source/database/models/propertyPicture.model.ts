import { Schema, Document, model, Types } from "mongoose";
import { MongoID } from "../../common";
export interface IPropertyPictures extends Document {
    userID: MongoID;
    businessProfileID?: MongoID;
    mediaID: MongoID;
}
const PropertyPicturesSchema: Schema = new Schema<IPropertyPictures>(
    {
        userID: { type: Schema.Types.ObjectId, ref: "User", required: true },
        mediaID: { type: Schema.Types.ObjectId, ref: "Media", required: true },
        businessProfileID: {
            type: Schema.Types.ObjectId,
            ref: "BusinessProfile"
        },
    },
    {
        timestamps: true
    }
);
PropertyPicturesSchema.set('toObject', { virtuals: true });
PropertyPicturesSchema.set('toJSON', { virtuals: true });

export interface IPropertyPicturesModel extends IPropertyPictures {
}

const PropertyPictures = model<IPropertyPictures>('PropertyPictures', PropertyPicturesSchema);
export default PropertyPictures;