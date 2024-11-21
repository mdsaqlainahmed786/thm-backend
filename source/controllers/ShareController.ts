import { Request, Response, NextFunction } from "express";
import { httpInternalServerError } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
const posts = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { thmsh } = request.query;
        console.log(thmsh);



        return response.send("post")
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

export default { posts }