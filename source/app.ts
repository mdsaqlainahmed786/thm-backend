import express, { Express, Request, Response, NextFunction, response } from "express";
import cookieParser from "cookie-parser";
import cors from 'cors';
import path from "path";
import { httpInternalServerError } from "./utils/response";
import ApiEndpoints from "./routes/api";
import { AppConfig } from "./config/constants";
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
const allowedOrigins: Array<string> = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
];
const options: cors.CorsOptions = {
    origin: allowedOrigins,
    exposedHeaders: 'x-auth-token',
    credentials: true,
};
App.use(cors(options));
App.use(`/public`, express.static(path.join(__dirname, "../public")));
App.use('', ApiEndpoints);
App.use((request: Request, response: Response, next: NextFunction) => {
    console.log(request.path);
    console.log(request.headers.forwarded)
    return response.sendStatus(404);
});
App.use((request: Request, response: Response, next: NextFunction) => {
    console.log(request.path);
    console.log(request.headers.forwarded)
    return response.sendStatus(404);
});
App.use((err: any, request: Request, response: Response, next: NextFunction) => {
    console.log(request.path);
    console.error('Logger ::::', err.stack)
    next(err)
});
App.use((err: any, request: Request, response: Response, next: NextFunction) => {
    if (request.xhr) {
        response.status(500).send({ error: 'Something failed!' })
    } else {
        next(err)
    }
});
App.use((err: any, request: Request, response: Response, next: NextFunction) => {
    const statusCode = err.status || 500;
    const errorMessage = err.message || 'Internal Server Error';
    return response.status(statusCode).send(httpInternalServerError(err, errorMessage))
});

export default App;