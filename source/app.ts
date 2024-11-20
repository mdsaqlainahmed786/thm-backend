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
App.use('', ApiEndpoints);
App.get('/chat-app', function (request: Request, response: Response) {
    const filePath = path.join(__dirname, "../public/files/index.html");
    return response.sendFile(filePath);
})

App.get('/chat-react', function (request: Request, response: Response) {
    const filePath = path.join(__dirname, "../public/files/index-react.html");
    return response.sendFile(filePath);
})
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