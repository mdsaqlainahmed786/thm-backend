import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { httpBadRequest } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
export function validateRequest(request: Request, response: Response, next: NextFunction) {
    const error = validationResult(request);
    if (!error.isEmpty()) {
        let extractedErrors: string | null = null;
        error.array({ onlyFirstError: true }).map(err => { //Api Validation Errors
            // extractedErrors = { [err.param]: err.msg }
            extractedErrors = err.msg;
            console.log(err);
        });
        return response.json(httpBadRequest(ErrorMessage.invalidRequest(extractedErrors ?? ErrorMessage.BAD_REQUEST, error), extractedErrors ?? ErrorMessage.BAD_REQUEST,));
    }
    next();
}
