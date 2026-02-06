"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.allowedOrigins = void 0;
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const response_1 = require("./utils/response");
const api_1 = __importDefault(require("./routes/api"));
const Database_1 = require("./database/Database");
const App = (0, express_1.default)();
App.use(express_1.default.json());
App.use(express_1.default.urlencoded({ extended: false }));
App.use(express_1.default.static("public"));
App.use((0, cookie_parser_1.default)());
(0, Database_1.connectDB)();
/**
 * Cors Policy
 */
exports.allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://thehotelmedia.com",
    "https://www.thehotelmedia.com",
    "https://admin.thehotelmedia.com",
    "https://www.admin.thehotelmedia.com",
    "https://hotels.thehotelmedia.com",
    "https://www.hotels.thehotelmedia.com",
    "ec2-13-202-52-159.ap-south-1.compute.amazonaws.com",
    "13.202.52.159"
];
const options = {
    origin: exports.allowedOrigins,
    exposedHeaders: 'x-auth-token',
    credentials: true,
};
App.use((0, cors_1.default)(options));
App.use(`/public`, express_1.default.static(path_1.default.join(__dirname, "../public")));
console.log("HELLO....");
App.get('/status', (request, response) => {
    return response.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});
App.get('/chat-react', function (request, response) {
    const filePath = path_1.default.join(__dirname, "../public/files/index-react.html");
    return response.sendFile(filePath);
});
App.use('', api_1.default);
App.use((request, response) => {
    console.log("Request Path:", request.path);
    console.log("Forwarded Headers:", request.headers.forwarded);
    return response.sendStatus(404);
});
App.use((err, request, response, next) => {
    console.error('RunTime Error', '\nRequest Path => ', request.path, '\nUser Data =>', request.user, '\nError ::::', err);
    next(err);
});
function isTimeoutLikeError(err) {
    var _a, _b, _c, _d, _e;
    if (!err)
        return false;
    if (err.code === "ETIMEDOUT")
        return true;
    if (err.name === "TimeoutError")
        return true;
    // AWS SDK v3 AggregateError includes an internal [errors] array
    const innerErrors = (_c = (_b = (_a = err === null || err === void 0 ? void 0 : err.errors) !== null && _a !== void 0 ? _a : err === null || err === void 0 ? void 0 : err[Symbol.for("errors")]) !== null && _b !== void 0 ? _b : err === null || err === void 0 ? void 0 : err["errors"]) !== null && _c !== void 0 ? _c : (_d = err === null || err === void 0 ? void 0 : err["$metadata"]) === null || _d === void 0 ? void 0 : _d.errors;
    if (Array.isArray(err === null || err === void 0 ? void 0 : err.errors) && err.errors.some((e) => (e === null || e === void 0 ? void 0 : e.code) === "ETIMEDOUT"))
        return true;
    if (Array.isArray(err === null || err === void 0 ? void 0 : err["errors"]) && err["errors"].some((e) => (e === null || e === void 0 ? void 0 : e.code) === "ETIMEDOUT"))
        return true;
    if (Array.isArray((_e = err === null || err === void 0 ? void 0 : err["$metadata"]) === null || _e === void 0 ? void 0 : _e.errors) && err["$metadata"].errors.some((e) => (e === null || e === void 0 ? void 0 : e.code) === "ETIMEDOUT"))
        return true;
    if (Array.isArray(innerErrors) && innerErrors.some((e) => (e === null || e === void 0 ? void 0 : e.code) === "ETIMEDOUT"))
        return true;
    return false;
}
App.use((err, request, response, next) => {
    if (request.xhr) {
        const isTimeout = isTimeoutLikeError(err);
        const statusCode = err.status || (isTimeout ? 503 : 500);
        const errorMessage = err.message || (isTimeout ? 'Storage service is temporarily unreachable. Please try again.' : 'Internal Server Error');
        response.status(statusCode).send(isTimeout ? (0, response_1.httpServiceUnavailable)(err, errorMessage) : (0, response_1.httpInternalServerError)(err, errorMessage));
    }
    else {
        next(err);
    }
});
App.use((err, request, response, next) => {
    const isTimeout = isTimeoutLikeError(err);
    const statusCode = err.status || (isTimeout ? 503 : 500);
    const errorMessage = err.message || (isTimeout ? 'Storage service is temporarily unreachable. Please try again.' : 'Internal Server Error');
    return response.status(statusCode).send(isTimeout ? (0, response_1.httpServiceUnavailable)(err, errorMessage) : (0, response_1.httpInternalServerError)(err, errorMessage));
});
exports.default = App;
