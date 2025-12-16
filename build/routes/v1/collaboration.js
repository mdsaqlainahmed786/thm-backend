"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const CollaborationController_1 = __importDefault(require("../../controllers/CollaborationController"));
const CollaborationEndpoints = express_1.default.Router();
CollaborationEndpoints.post("/invite", CollaborationController_1.default.inviteCollaborator);
CollaborationEndpoints.post("/respond", CollaborationController_1.default.respondToInvite);
CollaborationEndpoints.get("/", CollaborationController_1.default.getCollaborations);
CollaborationEndpoints.get("/:postID/collaborators", CollaborationController_1.default.getCollaboratorsForPost);
exports.default = CollaborationEndpoints;
