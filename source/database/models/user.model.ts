
import { Schema, Document, model, Types } from "mongoose";
import { genSalt, hash, compare } from 'bcrypt';
import { getAllKeysFromSchema } from "../../utils/helper/basic";
import BusinessProfile from './businessProfile.model';
import { isArray } from "../../utils/helper/basic";
import { IProfilePic, ProfileSchema } from "./common.model";
import { MongoID } from "../../common";
import { addMediaInStory } from "./story.model";
export enum AccountType {
    INDIVIDUAL = "individual",
    BUSINESS = "business"
}
export interface Individual {
    username: string;
    email: string;
    phoneNumber: string;
    dialCode: string;
    accountType: AccountType;
    password: string;
    name: string;
    isVerified: boolean;//for otp verification
    isActivated: boolean;//block or disable account 
    isDeleted: boolean;//soft delete 
    isApproved: boolean;//business account 
    otp: number;
    hasProfilePicture: boolean;
    bio: string;
    profilePic: IProfilePic;
    acceptedTerms: boolean;//User  accepted the terms
    privateAccount: boolean;
    notificationEnabled: boolean;
}

export interface Business {
    businessProfileID: MongoID;
}


export interface IUser extends Document, Individual, Business {
}


const UserSchema: Schema = new Schema<IUser>(
    {
        username: { type: String },
        profilePic: ProfileSchema,
        businessProfileID: {
            type: Schema.Types.ObjectId,
            ref: "BusinessProfile"
        },
        name: { type: String, required: true },
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
        isVerified: {
            type: Boolean, default: false
        },
        isApproved: {
            type: Boolean, default: true,
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
        acceptedTerms: {
            type: Boolean, default: false,
        },
        privateAccount: {
            type: Boolean, default: true,
        },
        notificationEnabled: {
            type: Boolean, default: true,
        }
    },
    {
        timestamps: true
    }
);
UserSchema.set('toObject', { virtuals: true });
UserSchema.set('toJSON', { virtuals: true });

type SafeUserData = Omit<IUserModel, 'password otp'>;

export interface IUserModel extends IUser {
    createdAt: Date;
    updatedAt: Date;
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
                addAmenitiesInBusinessProfile().lookup,
                addBusinessTypeInBusinessProfile().lookup,
                addBusinessTypeInBusinessProfile().unwindLookup,
                addBusinessSubTypeInBusinessProfile().lookup,
                addBusinessSubTypeInBusinessProfile().unwindLookup,
                {
                    '$lookup': {
                        'from': 'businessanswers',
                        'let': { 'amenitiesIDs': '$amenities' },
                        'pipeline': [
                            { '$match': { '$expr': { '$eq': ['$businessProfileID', '$$businessProfileID'] } } },
                            {
                                '$project': {
                                    'businessProfileID': 0,
                                    'createdAt': 0,
                                    'updatedAt': 0,
                                    '__v': 0,
                                }
                            }
                        ],
                        'as': 'businessAnswerRef'
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
            'as': 'businessProfileRef'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$businessProfileRef',
            'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
        }
    }
    const mergeObject = {
        $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$businessProfileRef", 0] }, "$$ROOT"] } }
    }

    return { lookup, unwindLookup, mergeObject }
}


/**
 * 
 * @returns Returns business profile's amenities lookup
 */
export function addAmenitiesInBusinessProfile() {
    const lookup = {
        '$lookup': {
            'from': 'businessquestions',
            'let': { 'amenitiesIDs': '$amenities' },
            'pipeline': [
                { '$match': { '$expr': { '$in': ['$_id', '$$amenitiesIDs'] } } },
                {
                    '$project': {
                        'answer': 0,
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
    }

    return { lookup }
}

/**
 * 
 * @returns Returns business type for business profile's 
 */
export function addBusinessTypeInBusinessProfile() {
    const lookup = {
        '$lookup': {
            'from': 'businesstypes',
            'let': { 'businessTypeID': '$businessTypeID' },
            'pipeline': [
                { '$match': { '$expr': { '$eq': ['$_id', '$$businessTypeID'] } } },
                {
                    '$project': {
                        'createdAt': 0,
                        'updatedAt': 0,
                        '__v': 0,
                    }
                }
            ],
            'as': 'businessTypeRef'
        }
    }
    const unwindLookup = {
        '$unwind': {
            'path': '$businessTypeRef',
            'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
        }
    }
    return { lookup, unwindLookup }
}
/**
 * 
 * @returns Returns business subtype for business profile's 
 */
export function addBusinessSubTypeInBusinessProfile() {
    const lookup = {
        '$lookup': {
            'from': 'businesssubtypes',
            'let': { 'businessSubTypeID': '$businessSubTypeID' },
            'pipeline': [
                { '$match': { '$expr': { '$eq': ['$_id', '$$businessSubTypeID'] } } },
                {
                    '$project': {
                        'businessTypeID': 0,
                        'createdAt': 0,
                        'updatedAt': 0,
                        '__v': 0,
                    }
                }
            ],
            'as': 'businessSubtypeRef'
        }
    }
    const unwindLookup = {
        '$unwind': {
            'path': '$businessSubtypeRef',
            'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
        }
    }
    return { lookup, unwindLookup }
}
/**
 * 
 * @param likeIDs Those IDs which are liked by the requested user will determine whether the current post was liked by them or not.
 * @returns 
 */
export function addStoriesInUser(likeIDs?: MongoID[] | null) {
    console.log(likeIDs);
    const lookup = {
        '$lookup': {
            'from': 'stories',
            'let': { 'userID': '$_id' },
            'pipeline': [
                { '$match': { '$expr': { '$eq': ['$userID', '$$userID'] }, timeStamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
                {
                    '$addFields': {
                        'likedByMe': {
                            $and: [
                                { $ne: [likeIDs, null] },
                                //FIXME Bro 
                                {
                                    $in: ['$_id', likeIDs]
                                }
                            ]
                        }
                    }
                },
                addMediaInStory().lookup,
                addMediaInStory().unwindLookup,
                addMediaInStory().replaceRootAndMergeObjects,
                addMediaInStory().project,
            ],
            'as': 'storiesRef'
        }
    };
    return { lookup }
}

export async function calculateProfileCompletion(userID: MongoID): Promise<number> {
    const userProfile = await User.findOne({ _id: userID });
    if (userProfile && userProfile.accountType === AccountType.INDIVIDUAL) {
        const schemaKeys = getAllKeysFromSchema(User.schema);
        const topLevelNestedFields = getTopLevelNestedFields(User.schema);
        // Remove top-level nested fields from the schemaKeys
        const filteredSchemaFields = schemaKeys.filter(field => !topLevelNestedFields.includes(field))
            .filter(field => !['profilePic.small', 'profilePic.medium', 'businessProfileID', 'otp'].includes(field));
        const filledKeys = filteredSchemaFields.filter((key) => {
            const value = userProfile?.get(key);
            if (isArray(value)) {
                return value?.length !== 0;
            } else {
                return value !== undefined && value !== null && value !== '';
            }
        });
        const completionPercentage = (filledKeys.length / filteredSchemaFields.length) * 100;
        const finalCompletionPercentage = completionPercentage.toFixed(2);
        return parseFloat(finalCompletionPercentage)
    }
    if (userProfile && userProfile.accountType === AccountType.BUSINESS && userProfile.businessProfileID) {
        const businessProfile = await BusinessProfile.findOne({ _id: userProfile.businessProfileID });
        const schemaKeys = getAllKeysFromSchema(BusinessProfile.schema);
        const topLevelNestedFields = getTopLevelNestedFields(BusinessProfile.schema);
        // Remove top-level nested fields from the schemaKeys
        const filteredSchemaFields = schemaKeys.filter(field => !topLevelNestedFields.includes(field))
            .filter(field => !['profilePic.small', 'profilePic.medium', 'otp'].includes(field));
        const filledKeys = filteredSchemaFields.filter((key) => {
            const value = businessProfile?.get(key);
            if (isArray(value)) {
                return value?.length !== 0;
            } else {
                return value !== undefined && value !== null && value !== '';
            }
        });
        const completionPercentage = (filledKeys.length / filteredSchemaFields.length) * 100;
        const finalCompletionPercentage = completionPercentage.toFixed(2);
        return parseFloat(finalCompletionPercentage)
    }
    return 0;

}

function getTopLevelNestedFields(schema: Schema): string[] {
    return Object.keys(schema.paths)
        .filter((key) => {
            const fieldSchema = schema.paths[key];
            return fieldSchema.schema !== undefined; // Check if the field has a nested schema
        });
}
/**
 * 
 * @param match  Used in an aggregation pipeline to filter documents.
 * @param likedByMe To check which post request user liked or not
 * @param savedByMe To check which post request user saved or not
 * @returns 
 * User Profile with some basic data like name username business profile reference 
 */
export function getUserProfile(match: { [key: string]: any; }, pageNumber: number, documentLimit: number) {
    return User.aggregate(
        [
            {
                $match: match
            },
            addBusinessProfileInUser().lookup,
            addBusinessProfileInUser().unwindLookup,
            {
                $sort: { createdAt: -1, id: 1 }
            },
            {
                $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
            },
            {
                $limit: documentLimit
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    accountType: 1,
                    username: 1,
                    profilePic: 1,
                    "businessProfileRef.name": 1,
                    "businessProfileRef.profilePic": 1,
                    "businessProfileRef.businessTypeRef": 1,
                    "businessProfileRef.address": 1,
                }
            }
        ]
    ).exec()
}

export const activeUserQuery = { isDeleted: false, isActivated: true };