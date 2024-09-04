
import { Types } from "mongoose";

import { AccountType } from "../database/models/user.model";
export interface AuthenticateUser {
    id: string | Types.ObjectId;
    accountType?: AccountType | undefined;
}








