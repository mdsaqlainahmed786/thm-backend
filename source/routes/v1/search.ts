import express, { Router } from "express";
import SearchController from "../../controllers/SearchController";
const SearchEndpoints: Router = express.Router();
SearchEndpoints.get('/', SearchController.index);
export default SearchEndpoints;