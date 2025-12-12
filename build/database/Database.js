"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDB = exports.connectDB = exports.database = void 0;
const constants_1 = require("../config/constants");
const mongoose_1 = __importDefault(require("mongoose"));
/** Create connection with Mongodb database */
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    if (exports.database) {
        return;
    }
    const CONNECTION_URI = constants_1.AppConfig.DB_CONNECTION;
    const options = {
        // useNewUrlParser: true,
        // useUnifiedTopology: true,
        //  autoIndex: true, //Modified later for achieving universal search.
        connectTimeoutMS: 5000,
        socketTimeoutMS: 5000,
    };
    try {
        mongoose_1.default.set('strictQuery', true);
        yield mongoose_1.default.connect(CONNECTION_URI, options);
        console.log("\nConnected to database");
    }
    catch (error) {
        console.log("\nDB Error1 :::", error);
        process.exit(1);
    }
    exports.database = mongoose_1.default.connection;
});
exports.connectDB = connectDB;
const disconnectDB = () => {
    if (!exports.database) {
        return;
    }
    mongoose_1.default.disconnect();
    console.log("\nDisconnected to database");
};
exports.disconnectDB = disconnectDB;
