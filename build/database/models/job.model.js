"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobType = void 0;
const mongoose_1 = require("mongoose");
var JobType;
(function (JobType) {
    JobType["FULL_TIME"] = "Full Time";
    JobType["PART_TIME"] = "Part Time";
    JobType["INTERNSHIP"] = "Internship";
    JobType["FREELANCE"] = "Freelance";
    JobType["CONTRACT"] = "Contract";
    JobType["TEMPORARY"] = "Temporary";
    JobType["VOLUNTEER"] = "Volunteer";
    JobType["OTHER"] = "Other";
})(JobType || (exports.JobType = JobType = {}));
const JobSchema = new mongoose_1.Schema({
    userID: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    businessProfileID: { type: mongoose_1.Schema.Types.ObjectId, ref: "BusinessProfile" },
    title: {
        type: String,
        required: true,
    },
    designation: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    jobType: {
        type: String,
        required: true,
        enum: JobType,
    },
    salary: {
        type: String,
        required: true,
    },
    joiningDate: {
        type: Date,
        required: true,
    },
    numberOfVacancies: {
        type: String,
        required: true,
    },
    experience: {
        type: String,
        required: true,
    },
}, {
    timestamps: true
});
JobSchema.set('toObject', { virtuals: true });
JobSchema.set('toJSON', { virtuals: true });
const Job = (0, mongoose_1.model)('Job', JobSchema);
exports.default = Job;
