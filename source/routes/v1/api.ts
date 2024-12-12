import express, { Router } from "express";
import HomeEndpoints from "./home-api";
import AuthEndpoint from "./auth";
import UserEndpoints from "./user";
import PostEndpoints from "./post";
import authenticateUser from "../../middleware/authenticate";
import UserConnectionEndpoints from "./user-connection";
import ReviewEndpoints from "./review";
import EventEndpoints from "./event";
import StoryEndpoints from "./story";
import NotificationEndpoints from "./notification";
import SearchEndpoints from "./search";
import FAQEndpoints from "./faq";
import ContactUsEndpoints from "./contact";
import AdminApiEndpoints from "./admin";
import ShareEndpoints from "./share";
const ApiEndpoints: Router = express.Router();
ApiEndpoints.use('', HomeEndpoints);
ApiEndpoints.use('/auth', AuthEndpoint);
ApiEndpoints.use('/contact-us', ContactUsEndpoints);
ApiEndpoints.use('/faqs', FAQEndpoints);
ApiEndpoints.use('/user', authenticateUser, UserConnectionEndpoints);
ApiEndpoints.use('/user', authenticateUser, UserEndpoints);
ApiEndpoints.use('/posts', authenticateUser, PostEndpoints);
ApiEndpoints.use('/reviews', ReviewEndpoints);
ApiEndpoints.use('/events', authenticateUser, EventEndpoints);
ApiEndpoints.use('/story', authenticateUser, StoryEndpoints);
ApiEndpoints.use('/notifications', authenticateUser, NotificationEndpoints);
ApiEndpoints.use('/search', authenticateUser, SearchEndpoints);
ApiEndpoints.use('/share', ShareEndpoints)

//Admin Routes
ApiEndpoints.use('/admin', AdminApiEndpoints)

export default ApiEndpoints;