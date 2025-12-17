"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpInternalServerError = httpInternalServerError;
exports.httpOk = httpOk;
exports.httpBadRequest = httpBadRequest;
exports.httpNotFoundOr404 = httpNotFoundOr404;
exports.httpUnauthorized = httpUnauthorized;
exports.httpConflict = httpConflict;
exports.httpForbidden = httpForbidden;
exports.httpOkExtended = httpOkExtended;
exports.httpCreated = httpCreated;
exports.httpNoContent = httpNoContent;
exports.httpAcceptedOrUpdated = httpAcceptedOrUpdated;
function httpNotFoundOr404(response, message) {
    const json_response = {
        status: false,
        statusCode: 404,
        message: message !== null && message !== void 0 ? message : "Not Found",
        data: response !== null && response !== void 0 ? response : null
    };
    return json_response;
}
function httpInternalServerError(response, message) {
    const json_response = {
        status: false,
        statusCode: 500,
        message: message !== null && message !== void 0 ? message : "Internal Server Error",
        data: response !== null && response !== void 0 ? response : null
    };
    return json_response;
}
function httpCreated(response, message) {
    const json_response = {
        status: true,
        statusCode: 201,
        message: message !== null && message !== void 0 ? message : "Created",
        data: response !== null && response !== void 0 ? response : null
    };
    return json_response;
}
function httpAcceptedOrUpdated(response, message) {
    const json_response = {
        status: true,
        statusCode: 202,
        message: message !== null && message !== void 0 ? message : "Accepted",
        data: response !== null && response !== void 0 ? response : null
    };
    return json_response;
}
function httpOk(response, message) {
    const json_response = {
        status: true,
        statusCode: 200,
        message: message !== null && message !== void 0 ? message : "OK",
        data: response !== null && response !== void 0 ? response : null
    };
    return json_response;
}
function httpOkExtended(response, message, pageNumber, totalPages, totalResources) {
    const json_response = {
        status: true,
        statusCode: 200,
        message: message,
        data: response !== null && response !== void 0 ? response : null,
        pageNo: pageNumber,
        totalPages: totalPages,
        totalResources: totalResources,
    };
    return json_response;
}
function httpConflict(response, message) {
    const json_response = {
        status: false,
        statusCode: 409,
        message: message !== null && message !== void 0 ? message : "Conflict",
        data: response !== null && response !== void 0 ? response : null
    };
    return json_response;
}
function httpUnauthorized(response, message) {
    const json_response = {
        status: false,
        statusCode: 401,
        message: message !== null && message !== void 0 ? message : "Unauthorized",
        data: response !== null && response !== void 0 ? response : null
    };
    return json_response;
}
function httpForbidden(response, message) {
    const json_response = {
        status: false,
        statusCode: 403,
        message: message !== null && message !== void 0 ? message : "Forbidden",
        data: response !== null && response !== void 0 ? response : null
    };
    return json_response;
}
function httpNoContent(response, message) {
    const json_response = {
        status: true,
        statusCode: 204,
        message: message !== null && message !== void 0 ? message : "No Content",
        data: response !== null && response !== void 0 ? response : null
    };
    return json_response;
}
function httpBadRequest(response, message) {
    const json_response = {
        status: false,
        statusCode: 400,
        message: message !== null && message !== void 0 ? message : "Bad Request",
        data: response !== null && response !== void 0 ? response : null
    };
    return json_response;
}
