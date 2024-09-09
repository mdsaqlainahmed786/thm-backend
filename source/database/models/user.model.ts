import { Schema, Document, model, Types } from "mongoose";
import { genSalt, hash, compare } from 'bcrypt';
import { addAmenitiesInBusinessProfile } from "./businessProfile.model";
export enum AccountType {
    INDIVIDUAL = "individual",
    BUSINESS = "business"
}


export interface IProfilePic {
    small: string;
    medium: string;
    large: string;
}

export interface Individual {
    email: string;
    phoneNumber: string;
    dialCode: string;
    accountType: AccountType;
    password: string;
    fullName: string;
    isVerified: boolean;//for otp verification
    isActivated: boolean;//block or disable account 
    isDeleted: boolean;//soft delete 
    otp: number;
    hasProfilePicture: boolean;
    bio: string;
    username: string;
    profilePic: IProfilePic;
}

export interface Business {
    businessProfileID: Types.ObjectId | string;
}


export interface IUser extends Document, Individual, Business {
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

const UserSchema: Schema = new Schema<IUser>(
    {
        profilePic: ProfileSchema,
        businessProfileID: {
            type: Schema.Types.ObjectId,
            ref: "BusinessProfile"
        },
        fullName: { type: String, required: true },
        email: { type: String, lowercase: true, index: true, required: true, unique: true, match: [/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, "email is invalid."], },
        password: {
            type: String,
            max: 1024,
            required: true,
            select: true,
        },
        bio: { type: String, default: '' },
        phoneNumber: { type: String },
        dialCode: { type: String },
        accountType: {
            type: String,
            enum: AccountType,
            default: AccountType.INDIVIDUAL
        },
        otp: {
            type: Number,
            maxlength: 5,
            default: 0,
            select: false
        },
        // coverImage: {
        //     type: String, default: ""
        // },
        // logo: {
        //     type: String, default: ""
        // },
        isVerified: {
            type: Boolean, default: false
        },
        isActivated: {
            type: Boolean, default: false
        },
        isDeleted: {//Soft delete 
            type: Boolean, default: false,
        },
        hasProfilePicture: {
            type: Boolean, default: false,
        },
    },
    {
        timestamps: true
    }
);
UserSchema.set('toObject', { virtuals: true });
UserSchema.set('toJSON', { virtuals: true });

type SafeUserData = Omit<IUserModel, 'password otp'>;

export interface IUserModel extends IUser {
    comparePassword(password: string): Promise<boolean>;
    hidePasswordAndAddTokens(accessToken: any, refreshToken: any): IUserModel;
    hideSensitiveData(): SafeUserData;
}

UserSchema.pre<IUserModel>('save', function (_next) {
    const user = this;
    if (!user.isModified('password')) {
        return _next();
    }
    genSalt(10, (error, salt) => {
        if (error) {
            return _next(error);
        }
        hash(user.password, salt, (error, passwordHash) => {
            if (error) {
                return _next(error);
            }
            user.password = passwordHash;
            return _next();
        });
    });
});


UserSchema.methods.comparePassword = async function (requestPassword: string): Promise<boolean> {
    return await compare(requestPassword, this.password)
};

UserSchema.methods.hidePasswordAndAddTokens = function (accessToken: string, refreshToken: string) {
    const user = this.toObject();
    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
    user.clusterRef = user.clusterID;
    user.clusterID = user.clusterID?._id;
    delete user.password;
    return user;
}

UserSchema.methods.hideSensitiveData = function () {
    const user = this.toObject();
    delete user.password;
    delete user.otp;
    return user as SafeUserData;
}


const User = model<IUserModel>('User', UserSchema);
export default User;

/**
 * 
 * @returns Return user business profile along with amenities reference
 */
export function addBusinessProfileInUser() {
    const lookup = {
        '$lookup': {
            'from': 'businessprofiles',
            'let': { 'businessProfileID': '$businessProfileID' },
            'pipeline': [
                { '$match': { '$expr': { '$eq': ['$_id', '$$businessProfileID'] } } },
                // addAmenitiesInBusinessProfile().lookup,
                {
                    '$lookup': {
                        'from': 'businessquestions',
                        'let': { 'amenitiesIDs': '$amenities' },
                        'pipeline': [
                            { '$match': { '$expr': { '$in': ['$_id', '$$amenitiesIDs'] } } },
                            {
                                '$project': {
                                    'question': 0,
                                    'businessTypeID': 0,
                                    'businessSubtypeID': 0,
                                    'createdAt': 0,
                                    'updatedAt': 0,
                                    '__v': 0,
                                }
                            }
                        ],
                        'as': 'amenitiesRef'
                    }
                },
                {
                    '$project': {
                        'createdAt': 0,
                        'updatedAt': 0,
                        '__v': 0,
                    }
                }
            ],
            'as': 'businessProfilesRef'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$businessProfilesRef',
            'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
        }
    }
    return { lookup, unwindLookup }
}