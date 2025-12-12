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
const node_cron_1 = __importDefault(require("node-cron"));
const constants_1 = require("../config/constants");
const FirebaseNotificationController_1 = require("../notification/FirebaseNotificationController");
/**
 * Cron job for remove the mobile device notification token which is no longer produced or used.
 * Run every data at 00:00
 */
function DBOptimizerCron() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, FirebaseNotificationController_1.removeObsoleteFCMTokens)();
    });
}
const DBOptimization = node_cron_1.default.schedule(constants_1.CronSchedule.EVERY_DAY_AT_00, DBOptimizerCron);
exports.default = DBOptimization;
