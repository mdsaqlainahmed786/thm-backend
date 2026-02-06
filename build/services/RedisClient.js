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
Object.defineProperty(exports, "__esModule", { value: true });
exports.initRedis = exports.RedisClient = void 0;
const redis_1 = require("redis");
/**
 * Shared Redis client singleton.
 *
 * Why this exists:
 * - Avoid circular imports like `model -> server -> app -> routes -> controller -> model`
 * - Allow any module to access Redis without importing `server.ts`
 */
exports.RedisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL, // optional; falls back to localhost if undefined
});
let initialized = false;
function initRedis() {
    return __awaiter(this, void 0, void 0, function* () {
        if (initialized)
            return;
        initialized = true;
        exports.RedisClient.on("error", (err) => {
            console.error("Redis Error:", err);
        });
        try {
            if (!exports.RedisClient.isOpen) {
                yield exports.RedisClient.connect();
            }
        }
        catch (err) {
            // Don't crash the app if Redis is unavailable; callers should handle cache misses.
            console.error("Redis connect failed:", err);
        }
    });
}
exports.initRedis = initRedis;
