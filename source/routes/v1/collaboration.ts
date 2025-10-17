import express, { Router } from "express";
import CollaborationController from "../../controllers/CollaborationController";

const CollaborationEndpoints: Router = express.Router();

CollaborationEndpoints.post("/invite", CollaborationController.inviteCollaborator);
CollaborationEndpoints.post("/respond", CollaborationController.respondToInvite);
CollaborationEndpoints.get("/", CollaborationController.getCollaborations);

export default CollaborationEndpoints;
