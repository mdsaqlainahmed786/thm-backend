interface JsonResponseModel {
    status: boolean;
    statusCode: number;
    message?: string;
    data: ResponseResult;
}
interface JsonResponseModelWithPage extends JsonResponseModel {
    pageNo: number;
    totalPages: number
    totalResources: number;
}

type ResponseResult = Array<any> | Object | null | undefined;

function httpNotFoundOr404(response?: ResponseResult, message?: string): JsonResponseModel {
    const json_response: JsonResponseModel = {
        status: false,
        statusCode: 404,
        message: message ?? "Not Found",
        data: response ?? null
    }
    return json_response;
}
function httpInternalServerError(response?: ResponseResult, message?: string): JsonResponseModel {
    const json_response: JsonResponseModel = {
        status: false,
        statusCode: 500,
        message: message ?? "Internal Server Error",
        data: response ?? null
    }
    return json_response;
}

// function httpCreated(response?: ResponseResult, message?: string): JsonResponseModel {
//     const json_response: JsonResponseModel = {
//         status: true,
//         statusCode: 201 ?? "Created",
//         message: message,
//         data: response ?? null
//     }
//     return json_response;
// }
// function httpAcceptedOrUpdated(response?: ResponseResult, message?: string): JsonResponseModel {
//     const json_response: JsonResponseModel = {
//         status: true,
//         statusCode: 202 ?? "Accepted",
//         message: message,
//         data: response ?? null
//     }
//     return json_response;
// }

function httpOk(response?: ResponseResult, message?: string): JsonResponseModel {
    const json_response: JsonResponseModel = {
        status: true,
        statusCode: 200,
        message: message ?? "OK",
        data: response ?? null
    }
    return json_response;

}
function httpOkExtended(response: ResponseResult, message: string, pageNumber: number, totalPages: number, totalResources: number): JsonResponseModelWithPage {
    const json_response: JsonResponseModelWithPage = {
        status: true,
        statusCode: 200,
        message: message,
        data: response ?? null,
        pageNo: pageNumber,
        totalPages: totalPages,
        totalResources: totalResources,
    }
    return json_response;
}

function httpConflict(response?: ResponseResult, message?: string): JsonResponseModel {
    const json_response: JsonResponseModel = {
        status: false,
        statusCode: 409,
        message: message ?? "Conflict",
        data: response ?? null
    }
    return json_response;
}
function httpUnauthorized(response?: ResponseResult, message?: string): JsonResponseModel {
    const json_response: JsonResponseModel = {
        status: false,
        statusCode: 401,
        message: message ?? "Unauthorized",
        data: response ?? null
    }
    return json_response;
}
function httpForbidden(response?: ResponseResult, message?: string): JsonResponseModel {
    const json_response: JsonResponseModel = {
        status: false,
        statusCode: 403,
        message: message ?? "Forbidden",
        data: response ?? null
    }
    return json_response;
}

function httpNoContent(response?: ResponseResult, message?: string): JsonResponseModel {
    const json_response: JsonResponseModel = {
        status: true,
        statusCode: 204,
        message: message ?? "No Content",
        data: response ?? null
    }
    return json_response;
}

function httpBadRequest(response?: ResponseResult, message?: string): JsonResponseModel {
    const json_response = {
        status: false,
        statusCode: 400,
        message: message ?? "Bad Request",
        data: response ?? null
    }
    return json_response;
}

export { httpInternalServerError, httpOk, httpBadRequest, httpNotFoundOr404, httpUnauthorized, httpConflict, httpForbidden }