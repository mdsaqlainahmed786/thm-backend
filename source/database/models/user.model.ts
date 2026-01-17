
import { Schema, Document, model, Types } from "mongoose";
import { genSalt, hash, compare } from 'bcrypt';
import { getAllKeysFromSchema } from "../../utils/helper/basic";
import BusinessProfile from './businessProfile.model';
import { isArray } from "../../utils/helper/basic";
import { GeoCoordinate, IProfilePic, ProfileSchema } from "./common.model";
import { Language, MongoID, Role } from "../../common";
import { addMediaInStory, addTaggedUsersInStory } from "./story.model";
import { addUserInLike } from "./like.model";
import { addUserInView } from "./view.model.";
import Post, { getPostsCount } from "./post.model";
import UserConnection, { ConnectionStatus, fetchFollowerCount, fetchFollowingCount } from "./userConnection.model";
import BlockedUser from "./blockedUser.model";
import { ObjectId } from "mongodb";
import { generateOTP } from "../../utils/helper/basic";
import EmailNotificationService from "../../services/EmailNotificationService";
import BusinessType from "./businessType.model";
import WeatherService from "../../services/WeatherService";
import { RedisClient } from "../../server";
const emailNotificationService = new EmailNotificationService();
export enum SocialAccount {
    FACEBOOK = "facebook",
    GOOGLE = "google",
    APPLE = "apple",
}

export interface ISocialID {
    socialUId: string;
    socialType: string,
}
const SocialIDSchema = new Schema<ISocialID>({
    socialUId: { type: String },
    socialType: { type: String, enum: SocialAccount, required: true },

});

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
    role: Role;
    lastSeen: Date;
    socialIDs: ISocialID[];
    profession: string;
    geoCoordinate: GeoCoordinate;
    language: string;
    mobileVerified: boolean;
    adminPassword?: string | null; // Password set by admin for administrator accounts
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
        mobileVerified: {
            type: Boolean,
            default: false // False by default, indicating the phone number is not verified
        },
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
            type: Boolean, default: false,
        },
        notificationEnabled: {
            type: Boolean, default: true,
        },
        role: {
            type: String, enum: Role, default: Role.USER,
        },
        socialIDs: [SocialIDSchema],
        lastSeen: { type: Date, default: Date.now },
        profession: {
            type: String,
            default: ""
        },
        language: {
            type: String,
            default: Language.English,
            enum: Language,
            required: true
        },
        geoCoordinate: {
            type: {
                type: String,
                enum: ['Point'],  // Specify the type as "Point" for geo spatial indexing
            },
            coordinates: {
                type: [Number],
            }
        },
        adminPassword: {
            type: String,
            default: null,
            select: false // Don't select by default for security
        },

    },
    {
        timestamps: true
    }
);
UserSchema.index({ 'geoCoordinate': '2dsphere' });
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
export function addStoriesInUser(likeIDs?: MongoID[] | null, viewedStories?: MongoID[] | null) {
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
                {
                    '$addFields': {
                        'seenByMe': {
                            $and: [
                                { $ne: [viewedStories, null] },
                                //FIXME Bro 
                                {
                                    $in: ['$_id', viewedStories]
                                }
                            ]
                        }
                    }
                },
                addMediaInStory().lookup,
                addMediaInStory().unwindLookup,
                addMediaInStory().replaceRootAndMergeObjects,
                addMediaInStory().project,
                addTaggedUsersInStory().addFieldsBeforeUnwind,
                addTaggedUsersInStory().unwind,
                addTaggedUsersInStory().lookup,
                addTaggedUsersInStory().addFields,
                addTaggedUsersInStory().group,
                addTaggedUsersInStory().replaceRoot,
                {
                    '$lookup': {
                        'from': 'likes',
                        'let': { 'storyID': '$_id' },
                        'pipeline': [
                            { '$match': { '$expr': { '$eq': ['$storyID', '$$storyID'] } } },
                            addUserInLike().lookup,
                            addUserInLike().unwindLookup,
                            addUserInLike().replaceRoot,
                        ],
                        'as': 'likesRef'
                    }
                },
                {
                    $addFields: {
                        likes: { $cond: { if: { $isArray: "$likesRef" }, then: { $size: "$likesRef" }, else: 0 } }
                    }
                },
                {
                    $addFields: {
                        likesRef: { $slice: ["$likesRef", 4] },
                    }
                },
                {
                    $lookup: {
                        from: 'views',
                        let: { storyID: '$_id' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$storyID', '$$storyID'] } } },
                            addUserInView().lookup,
                            addUserInView().unwindLookup,
                            addUserInView().replaceRoot,
                        ],
                        as: 'viewsRef'
                    }
                },
                {
                    $addFields: {
                        views: { $cond: { if: { $isArray: "$viewsRef" }, then: { $size: "$viewsRef" }, else: 0 } }
                    }
                },
                {
                    $addFields: {
                        viewsRef: { $slice: ["$viewsRef", 4] },
                    }
                },
            ],
            'as': 'storiesRef'
        }
    };
    return { lookup }
}

export async function calculateProfileCompletion(userID: MongoID): Promise<number> {
    const removeField = ['profilePic.small', 'profilePic.medium', 'businessProfileID', 'otp', 'socialIDs.socialUId', 'socialIDs.socialType', 'socialIDs._id', 'password', '_id', "__v", "password", "createdAt", "updatedAt", "geoCoordinate.type", "geoCoordinate.coordinates", "lastSeen"];
    const userProfile = await User.findOne({ _id: userID });
    if (userProfile && userProfile.accountType === AccountType.INDIVIDUAL) {
        const schemaKeys = getAllKeysFromSchema(User.schema);
        const topLevelNestedFields = getTopLevelNestedFields(User.schema);
        // Remove top-level nested fields from the schemaKeys
        const filteredSchemaFields = schemaKeys.filter(field => !topLevelNestedFields.includes(field))
            .filter(field => !removeField.includes(field));
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
            .filter(field => ![...removeField, "profession"].includes(field));
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
            profileProject(),
        ]
    ).exec()
}

export function profileProject() {
    return {
        "$project": {
            "_id": 1,
            "name": 1,
            "profilePic": 1,
            "role": 1,
            "accountType": 1,
            "username": 1,
            "businessProfileRef.name": 1,
            "businessProfileRef.profilePic": 1,
            "businessProfileRef.businessTypeRef": 1,
            "businessProfileRef.address": 1,
        }
    }
}
export function profileBasicProject() {
    return {
        "$project": {
            "name": 1,
            "username": 1,
            "accountType": 1,
            'profilePic': 1,
            'businessProfileRef._id': 1,
            'businessProfileRef.profilePic': 1,
            'businessProfileRef.username': 1,
            'businessProfileRef.name': 1,
        }
    }
}

export async function getBlockedUsers(userID: MongoID) {
    return await BlockedUser.distinct('blockedUserID', { userID: userID });
}
export async function getBlockedByUsers(userID: MongoID) {
    return await BlockedUser.distinct('userID', { blockedUserID: userID });
}

export async function getUserPublicProfile(userID: MongoID, id: MongoID) {
    return await Promise.all([
        User.aggregate([
            {
                $match: {
                    _id: new ObjectId(userID)
                }
            },
            addBusinessProfileInUser().lookup,
            addBusinessProfileInUser().unwindLookup,
            {
                $limit: 1,
            },
            {
                $project: {
                    "businessProfileRef.businessAnswerRef": 0,
                    isVerified: 0,
                    isApproved: 0,
                    isActivated: 0,
                    isDeleted: 0,
                    hasProfilePicture: 0,
                    acceptedTerms: 0,
                    profileCompleted: 0,
                    email: 0,
                    dialCode: 0,
                    phoneNumber: 0,
                    otp: 0,
                    password: 0,
                    createdAt: 0,
                    updatedAt: 0,
                    __v: 0,
                }
            }
        ]),
        getPostsCount(userID),
        fetchFollowerCount(userID),
        fetchFollowingCount(userID),
        UserConnection.findOne({ following: userID, follower: id, }),
        BlockedUser.findOne({ blockedUserID: userID, userID: id })
    ]);
}
export async function getBusinessType(businessProfileID: MongoID,) {
    const businessProfile = await BusinessProfile.findOne({ _id: businessProfileID });
    if (businessProfile) {
        const businessType = await BusinessType.findOne({ _id: businessProfile.businessTypeID });
        if (businessType) {
            return businessType.name;
        }
    }
    return null;
}

export async function fetchWeatherAndAirPollutionReport(businessProfileID: MongoID,) {
    const businessProfile = await BusinessProfile.findOne({ _id: businessProfileID });
    if (businessProfile) {
        const lat = Number(businessProfile?.address?.lat ?? 0);
        const lng = Number(businessProfile?.address?.lng ?? 0);
        try {
            const weatherReportKey = `weather::${businessProfileID}`;
            const weatherReport = await RedisClient.get(weatherReportKey);
            if (weatherReport) {
                console.log("no api call return cache");
                return JSON.parse(weatherReport);
            }
            console.log("api call");
            const [airPollution, weather] = await Promise.all([
                WeatherService.airPollution(lat, lng),
                WeatherService.weather(lat, lng)
            ]);
            const data = {
                ...weather,
                airPollution: airPollution
            };
            await RedisClient.set(weatherReportKey, JSON.stringify(data), {
                EX: (60 * 60 * 24 * 15)//second * minutes * hour * day = seconds 
            });
            return data;
        } catch {
            return null;
        }
    }
    return null;
}

export const activeUserQuery = { isVerified: true, isApproved: true, isActivated: true, isDeleted: false, };


/**
 * 
 * @param data 
 * @param sendOTP 
 * @returns 
 * Return new user account 
 */
export async function createUserAccount(data: any, sendOTP: boolean) {
    const { name, password, profession, username, email, accountType, dialCode, phoneNumber, profilePic, isActivated, businessProfileID, isApproved, privateAccount, geoCoordinate, isVerified, hasProfilePicture, socialIDs, language } = data;
    const newUser = new User();
    newUser.profilePic = profilePic;
    newUser.profession = profession;
    newUser.username = username;
    newUser.email = email;
    newUser.name = name;
    newUser.accountType = accountType;
    newUser.dialCode = dialCode;
    newUser.phoneNumber = phoneNumber;
    newUser.password = password;
    newUser.isActivated = isActivated;
    if (geoCoordinate) {
        newUser.geoCoordinate = geoCoordinate;
    }
    if (language) {
        newUser.language = language;
    }
    if (businessProfileID) {
        newUser.businessProfileID = businessProfileID;
    }
    if (isVerified !== undefined && isVerified !== null && isVerified === true) {
        newUser.isVerified = isVerified;
    }
    if (hasProfilePicture !== undefined && hasProfilePicture !== null && hasProfilePicture === true) {
        newUser.hasProfilePicture = hasProfilePicture;
    }
    if (isApproved !== undefined && isApproved !== null && isApproved === false) {
        newUser.isApproved = isApproved;//The business account needs to be approved by the admin; the default value of 'isApproved' is true.
    }
    if (privateAccount !== undefined && privateAccount !== null) {
        newUser.privateAccount = privateAccount;
    } else {
        newUser.privateAccount = false; // Default to public account
    }
    if (socialIDs && isArray(socialIDs)) {
        newUser.socialIDs = socialIDs;
    }
    const otp = generateOTP();
    if (sendOTP) {
        emailNotificationService.sendEmailOTP(otp, newUser.email, 'verify-email');
    }
    newUser.otp = otp;
    return await newUser.save();
}

/**
 * 
 * @param data 
 * @returns 
 * Return new business profile
 */
export async function createBusinessProfile(data: any) {
    const { profilePic, username, businessTypeID, businessSubTypeID, name, bio, email, phoneNumber, dialCode, website, gstn, address, placeID, privateAccount } = data;
    const newBusinessProfile = new BusinessProfile();
    newBusinessProfile.profilePic = profilePic;
    newBusinessProfile.username = username;
    newBusinessProfile.businessTypeID = businessTypeID;
    newBusinessProfile.businessSubTypeID = businessSubTypeID;
    newBusinessProfile.name = name;
    newBusinessProfile.bio = bio;
    newBusinessProfile.address = address;
    newBusinessProfile.email = email;
    newBusinessProfile.phoneNumber = phoneNumber;
    newBusinessProfile.dialCode = dialCode;
    newBusinessProfile.website = website;
    newBusinessProfile.gstn = gstn;
    newBusinessProfile.placeID = placeID;
    if (privateAccount !== undefined && privateAccount !== null) {
        newBusinessProfile.privateAccount = privateAccount;
    } else {
        newBusinessProfile.privateAccount = false; // Default to public account
    }
    return await newBusinessProfile.save();
}