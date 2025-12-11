import { Document, Model, Schema, model, Types } from "mongoose";
import { MongoID } from "../../common";

export enum JobType {
    FULL_TIME = "Full Time",
    PART_TIME = "Part Time",
    INTERNSHIP = "Internship",
    FREELANCE = "Freelance",
    CONTRACT = "Contract",
    TEMPORARY = "Temporary",
    VOLUNTEER = "Volunteer",
    OTHER = "Other",
}


interface IJob extends Document {
    userID: MongoID;
    businessProfileID?: MongoID;
    title: string;
    designation: string;
    description: string;
    jobType: string;
    salary: string;
    joiningDate: Date;
    numberOfVacancies: string;
    experience: string;
}
const JobSchema: Schema = new Schema<IJob>(
    {
        userID: { type: Schema.Types.ObjectId, ref: "User", required: true },
        businessProfileID: { type: Schema.Types.ObjectId, ref: "BusinessProfile" },
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
    },
    {
        timestamps: true
    }
);
JobSchema.set('toObject', { virtuals: true });
JobSchema.set('toJSON', { virtuals: true });

export interface IJobModel extends Model<IJob> {
}

const Job = model<IJob, IJobModel>('Job', JobSchema);
export default Job;


