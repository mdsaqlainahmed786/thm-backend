"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUserInView = addUserInView;
const mongoose_1 = require("mongoose");
const user_model_1 = require("./user.model");
//FIXME Add boolean type to Post with Media and Story
const ViewsSchema = new mongoose_1.Schema({
    userID: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    storyID: { type: mongoose_1.Schema.Types.ObjectId, ref: "Story", },
    businessProfileID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "BusinessProfile"
    },
    postID: { type: mongoose_1.Schema.Types.ObjectId, ref: "Post" },
    mediaID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Media"
    },
}, {
    timestamps: true
});
ViewsSchema.set('toObject', { virtuals: true });
ViewsSchema.set('toJSON', { virtuals: true });
const View = (0, mongoose_1.model)('View', ViewsSchema);
exports.default = View;
function addUserInView() {
    const lookup = {
        '$lookup': {
            'from': 'users',
            'let': { 'userID': '$userID' },
            'pipeline': [
                { '$match': { '$expr': { '$eq': ['$_id', '$$userID'] } } },
                (0, user_model_1.addBusinessProfileInUser)().lookup,
                (0, user_model_1.addBusinessProfileInUser)().unwindLookup,
                (0, user_model_1.profileBasicProject)(),
            ],
            'as': 'likedByRef'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$likedByRef',
            'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
        }
    };
    const replaceRoot = {
        "$replaceRoot": {
            "newRoot": {
                "$mergeObjects": ["$likedByRef"]
            }
        }
    };
    return { lookup, unwindLookup, replaceRoot };
}
