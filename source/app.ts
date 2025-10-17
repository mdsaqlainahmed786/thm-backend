import express, { Express, Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from 'cors';
import path from "path";
import { httpInternalServerError } from "./utils/response";
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
App.use((err: any, request: Request, response: Response, next: NextFunction) => {
    if (request.xhr) {
        const statusCode = err.status || 500;
        const errorMessage = err.message || 'Internal Server Error';
        response.status(statusCode).send(httpInternalServerError(err, errorMessage))
    } else {
        next(err)
    }
});

App.get("/status", (request: Request, response: Response) => {
    return response.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
})
App.use((err: any, request: Request, response: Response, next: NextFunction) => {
    const statusCode = err.status || 500;
    const errorMessage = err.message || 'Internal Server Error';
    return response.status(statusCode).send(httpInternalServerError(err, errorMessage))
});

export default App;