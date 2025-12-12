"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueStatus = void 0;
const mongoose_1 = require("mongoose");
var QueueStatus;
(function (QueueStatus) {
    QueueStatus["CREATED"] = "created";
    QueueStatus["PROCESSING"] = "processing";
    QueueStatus["COMPLETED"] = "completed";
    QueueStatus["ERROR"] = "error";
})(QueueStatus || (exports.QueueStatus = QueueStatus = {}));
const FileQueueSchema = new mongoose_1.Schema({
    filePath: { type: String, required: false },
    status: { type: String, enum: QueueStatus, default: QueueStatus.CREATED, required: true },
    s3Key: { type: String, required: true },
    s3Location: [{ type: String }],
    jobID: { type: String },
    mediaID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Media"
    },
}, {
    timestamps: true
});
const FileQueue = (0, mongoose_1.model)("FileQueue", FileQueueSchema);
exports.default = FileQueue;
