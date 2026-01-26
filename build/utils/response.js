"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpAcceptedOrUpdated = exports.httpNoContent = exports.httpCreated = exports.httpOkExtended = exports.httpForbidden = exports.httpConflict = exports.httpUnauthorized = exports.httpNotFoundOr404 = exports.httpBadRequest = exports.httpOk = exports.httpServiceUnavailable = exports.httpInternalServerError = void 0;
function httpNotFoundOr404(response, message) {
    const json_response = {
        status: false,
        statusCode: 404,
        message: message !== null && message !== void 0 ? message : "Not Found",
        data: response !== null && response !== void 0 ? response : null
    };
    return json_response;
}
exports.httpNotFoundOr404 = httpNotFoundOr404;
function httpInternalServerError(response, message) {
    const json_response = {
        status: false,
        statusCode: 500,
        message: message !== null && message !== void 0 ? message : "Internal Server Error",
        data: response !== null && response !== void 0 ? response : null
    };
    return json_response;
}
exports.httpInternalServerError = httpInternalServerError;
function httpServiceUnavailable(response, message) {
    const json_response = {
        status: false,
        statusCode: 503,
        message: message !== null && message !== void 0 ? message : "Service Unavailable",
        data: response !== null && response !== void 0 ? response : null
    };
    return json_response;
}
exports.httpServiceUnavailable = httpServiceUnavailable;
function httpCreated(response, message) {
    const json_response = {
        status: true,
        statusCode: 201,
        message: message !== null && message !== void 0 ? message : "Created",
        data: response !== null && response !== void 0 ? response : null
    };
    return json_response;
}
exports.httpCreated = httpCreated;
function httpAcceptedOrUpdated(response, message) {
    const json_response = {
        status: true,
        statusCode: 202,
        message: message !== null && message !== void 0 ? message : "Accepted",
        data: response !== null && response !== void 0 ? response : null
    };
    return json_response;
}
exports.httpAcceptedOrUpdated = httpAcceptedOrUpdated;
function httpOk(response, message) {
    const json_response = {
        status: true,
        statusCode: 200,
        message: message !== null && message !== void 0 ? message : "OK",
        data: response !== null && response !== void 0 ? response : null
    };
    return json_response;
}
exports.httpOk = httpOk;
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
exports.httpOkExtended = httpOkExtended;
function httpConflict(response, message) {
    const json_response = {
        status: false,
        statusCode: 409,
        message: message !== null && message !== void 0 ? message : "Conflict",
        data: response !== null && response !== void 0 ? response : null
    };
    return json_response;
}
exports.httpConflict = httpConflict;
function httpUnauthorized(response, message) {
    const json_response = {
        status: false,
        statusCode: 401,
        message: message !== null && message !== void 0 ? message : "Unauthorized",
        data: response !== null && response !== void 0 ? response : null
    };
    return json_response;
}
exports.httpUnauthorized = httpUnauthorized;
function httpForbidden(response, message) {
    const json_response = {
        status: false,
        statusCode: 403,
        message: message !== null && message !== void 0 ? message : "Forbidden",
        data: response !== null && response !== void 0 ? response : null
    };
    return json_response;
}
exports.httpForbidden = httpForbidden;
function httpNoContent(response, message) {
    const json_response = {
        status: true,
        statusCode: 204,
        message: message !== null && message !== void 0 ? message : "No Content",
        data: response !== null && response !== void 0 ? response : null
    };
    return json_response;
}
exports.httpNoContent = httpNoContent;
function httpBadRequest(response, message) {
    const json_response = {
        status: false,
        statusCode: 400,
        message: message !== null && message !== void 0 ? message : "Bad Request",
        data: response !== null && response !== void 0 ? response : null
    };
    return json_response;
}
exports.httpBadRequest = httpBadRequest;
