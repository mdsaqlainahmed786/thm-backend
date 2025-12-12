"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUserInReport = exports.addCommentInReport = exports.addPostInReport = exports.addReportedByInReport = void 0;
const mongoose_1 = require("mongoose");
const common_1 = require("../../common");
const user_model_1 = require("./user.model");
const ReportSchema = new mongoose_1.Schema({
    reportedBy: { type: mongoose_1.Schema.Types.ObjectId, Ref: "User", required: true },
    contentID: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    contentType: {
        type: String,
        enum: common_1.ContentType,
        default: common_1.ContentType.ANONYMOUS
    },
    reason: { type: String },
}, {
    timestamps: true
});
const Report = (0, mongoose_1.model)("Report", ReportSchema);
exports.default = Report;
function addReportedByInReport() {
    const lookup = {
        '$lookup': {
            'from': 'users',
            'let': { 'userID': '$reportedBy', },
            'pipeline': [
                {
                    '$match': {
                        '$expr': { '$eq': ['$_id', '$$userID'] },
                    }
                },
                (0, user_model_1.addBusinessProfileInUser)().lookup,
                (0, user_model_1.addBusinessProfileInUser)().unwindLookup,
                (0, user_model_1.profileBasicProject)(),
            ],
            'as': 'reportedByRef'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$reportedByRef',
            'preserveNullAndEmptyArrays': true
        }
    };
    return { lookup, unwindLookup };
}
exports.addReportedByInReport = addReportedByInReport;
function addPostInReport() {
    const lookup = {
        '$lookup': {
            'from': 'posts',
            'let': { 'postID': '$contentID', 'contentType': '$contentType' },
            'pipeline': [
                {
                    '$match': {
                        '$expr': {
                            '$and': [
                                { '$eq': ['$_id', '$$postID'] },
                                { '$eq': ['$$contentType', common_1.ContentType.POST] }
                            ]
                        }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        content: 1,
                        postType: 1,
                    }
                }
            ],
            'as': 'postsRef'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$postsRef',
            'preserveNullAndEmptyArrays': true
        }
    };
    return { lookup, unwindLookup };
}
exports.addPostInReport = addPostInReport;
function addCommentInReport() {
    const lookup = {
        '$lookup': {
            'from': 'comments',
            'let': { 'commentID': '$contentID', 'contentType': '$contentType' },
            'pipeline': [
                {
                    '$match': {
                        '$expr': {
                            '$and': [
                                { '$eq': ['$_id', '$$commentID'] },
                                { '$eq': ['$$contentType', common_1.ContentType.COMMENT] }
                            ]
                        }
                    }
                },
                {
                    '$lookup': {
                        'from': 'posts',
                        'let': { 'postID': '$postID', },
                        'pipeline': [
                            {
                                '$match': {
                                    '$expr': { '$eq': ['$_id', '$$postID'] },
                                }
                            },
                        ],
                        'as': 'postsRef'
                    }
                },
                {
                    '$unwind': {
                        'path': '$postsRef',
                        'preserveNullAndEmptyArrays': true
                    }
                },
                {
                    $project: {
                        _id: 1,
                        postType: {
                            '$ifNull': [{ '$ifNull': ['$postsRef.postType', ''] }, '']
                        },
                        postID: 1,
                        message: 1,
                        userID: 1,
                        posts: 1,
                    }
                }
            ],
            'as': 'commentsRef'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$commentsRef',
            'preserveNullAndEmptyArrays': true
        }
    };
    return { lookup, unwindLookup };
}
exports.addCommentInReport = addCommentInReport;
function addUserInReport() {
    const lookup = {
        '$lookup': {
            'from': 'users',
            'let': { 'userID': '$contentID', 'contentType': '$contentType' },
            'pipeline': [
                {
                    '$match': {
                        '$expr': {
                            '$and': [
                                { '$eq': ['$_id', '$$userID'] },
                                { '$eq': ['$$contentType', common_1.ContentType.USER] }
                            ]
                        }
                    }
                },
                (0, user_model_1.addBusinessProfileInUser)().lookup,
                (0, user_model_1.addBusinessProfileInUser)().unwindLookup,
                (0, user_model_1.profileBasicProject)(),
            ],
            'as': 'usersRef'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$usersRef',
            'preserveNullAndEmptyArrays': true
        }
    };
    return { lookup, unwindLookup };
}
exports.addUserInReport = addUserInReport;
