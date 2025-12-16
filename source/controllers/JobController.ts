import { ObjectId } from 'mongodb';
import { Request, Response, NextFunction } from "express";
import { httpBadRequest, httpCreated, httpInternalServerError, httpNoContent, httpNotFoundOr404, httpOk, httpForbidden } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import Post from "../database/models/post.model";
import Like from '../database/models/like.model';
import Comment from '../database/models/comment.model';
import Story from "../database/models/story.model";
import AppNotificationController from "../controllers/AppNotificationController";
import User, { addBusinessProfileInUser } from "../database/models/user.model";
import { NotificationType } from "../database/models/notification.model";
import { AccountType } from "../database/models/anonymousUser.model";
import Job from "../database/models/job.model";

const index = async (request: Request, response: Response, next: NextFunction) => {
    try {

    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const store = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        const { title, designation, description, jobType, salary, joiningDate, numberOfVacancies, experience } = request.body;
        const user = await User.findOne({ _id: id });
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (user.accountType !== AccountType.BUSINESS) {
            return response.send(httpForbidden(ErrorMessage.invalidRequest("Access Denied! You don't have business account"), "Access Denied! You don't have business account"))
        }
        const newJob = new Job();
        newJob.userID = id;
        newJob.businessProfileID = user.businessProfileID;
        newJob.title = title;
        newJob.designation = designation;
        newJob.description = description;
        newJob.jobType = jobType;
        newJob.salary = salary;
        newJob.joiningDate = joiningDate;
        newJob.numberOfVacancies = numberOfVacancies;
        newJob.experience = experience;
        const savedJob = await newJob.save();
        // Note: Job notifications should be sent to followers or target users
        // For now, this is commented out. Uncomment and specify targetUserID when implementing follower notifications
        // AppNotificationController.store(id, targetUserID, NotificationType.JOB, { jobID: savedJob.id, title: savedJob.title }).catch((error: any) => console.error(error))
        return response.send(httpCreated(savedJob, "Job posted successfully"))
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const update = async (request: Request, response: Response, next: NextFunction) => {
    try {
        // return response.send(httpAcceptedOrUpdated(null, 'Not implemented'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const destroy = async (request: Request, response: Response, next: NextFunction) => {
    try {
        // return response.send(httpNoContent(null, 'Not implemented'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const show = async (request: Request, response: Response, next: NextFunction) => {
    try {
        let { id } = request.params;
        const dbQuery = { _id: new ObjectId(id) };
        const job = await Job.aggregate([
            {
                $match: dbQuery
            },
            {
                '$lookup': {
                    'from': 'users',
                    'let': { 'userID': '$userID' },
                    'pipeline': [
                        { '$match': { '$expr': { '$eq': ['$_id', '$$userID'] } } },
                        addBusinessProfileInUser().lookup,
                        addBusinessProfileInUser().unwindLookup,
                        {
                            '$project': {
                                "name": 1,
                                'username': 1,
                                "profilePic": 1,
                                "accountType": 1,
                                "businessProfileID": 1,
                                "businessProfileRef._id": 1,
                                "businessProfileRef.name": 1,
                                "businessProfileRef.profilePic": 1,
                                'businessProfileRef.username': 1
                            }
                        }
                    ],
                    'as': 'postedBy'
                }
            },
            {
                '$unwind': {
                    'path': '$postedBy',
                    'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
                }
            },
        ]);
        if (job.length === 0) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        return response.send(httpOk(job[0], "Job data fetched"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

export default { index, store, update, destroy, show };
