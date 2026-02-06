import express, { Express, Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from 'cors';
import path from "path";
import { httpInternalServerError, httpServiceUnavailable } from "./utils/response";
import ApiEndpoints from "./routes/api";
import { connectDB } from "./database/Database";
const App: Express = express();
App.use(express.json());
App.use(express.urlencoded({ extended: false }));
App.use(express.static("public"));
App.use(cookieParser());

connectDB();

/**
 * Cors Policy
 */
export const allowedOrigins: Array<string> = [
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
const options: cors.CorsOptions = {
    origin: allowedOrigins,
    exposedHeaders: 'x-auth-token',
    credentials: true,
};
App.use(cors(options));
App.use(`/public`, express.static(path.join(__dirname, "../public")));
console.log("HELLO....")
App.get('/status', (request: Request, response: Response) => {
    return response.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
})
App.get('/chat-react', function (request: Request, response: Response) {
    const filePath = path.join(__dirname, "../public/files/index-react.html");
    return response.sendFile(filePath);
})
App.use('', ApiEndpoints);
App.use((request: Request, response: Response) => {
    console.log("Request Path:", request.path);
    console.log("Forwarded Headers:", request.headers.forwarded);
    return response.sendStatus(404);
});
App.use((err: any, request: Request, response: Response, next: NextFunction) => {
    console.error(
        'RunTime Error',
        '\nRequest Path => ', request.path,
        '\nUser Data =>', request.user,
        '\nError ::::', err
    )
    next(err)
});

function isTimeoutLikeError(err: any): boolean {
    if (!err) return false;
    if (err.code === "ETIMEDOUT") return true;
    if (err.name === "TimeoutError") return true;
    // AWS SDK v3 AggregateError includes an internal [errors] array
    const innerErrors = err?.errors ?? err?.[Symbol.for("errors")] ?? err?.["errors"] ?? err?.["$metadata"]?.errors;
    if (Array.isArray(err?.errors) && err.errors.some((e: any) => e?.code === "ETIMEDOUT")) return true;
    if (Array.isArray(err?.["errors"]) && err["errors"].some((e: any) => e?.code === "ETIMEDOUT")) return true;
    if (Array.isArray(err?.["$metadata"]?.errors) && err["$metadata"].errors.some((e: any) => e?.code === "ETIMEDOUT")) return true;
    if (Array.isArray(innerErrors) && innerErrors.some((e: any) => e?.code === "ETIMEDOUT")) return true;
    return false;
}
App.use((err: any, request: Request, response: Response, next: NextFunction) => {
    if (request.xhr) {
        const isTimeout = isTimeoutLikeError(err);
        const statusCode = err.status || (isTimeout ? 503 : 500);
        const errorMessage = err.message || (isTimeout ? 'Storage service is temporarily unreachable. Please try again.' : 'Internal Server Error');
        response.status(statusCode).send(isTimeout ? httpServiceUnavailable(err, errorMessage) : httpInternalServerError(err, errorMessage))
    } else {
        next(err)
    }
});

App.use((err: any, request: Request, response: Response, next: NextFunction) => {
    const isTimeout = isTimeoutLikeError(err);
    const statusCode = err.status || (isTimeout ? 503 : 500);
    const errorMessage = err.message || (isTimeout ? 'Storage service is temporarily unreachable. Please try again.' : 'Internal Server Error');
    return response.status(statusCode).send(isTimeout ? httpServiceUnavailable(err, errorMessage) : httpInternalServerError(err, errorMessage))
});

export default App;