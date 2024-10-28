
import { Types } from "mongoose";

import { AccountType } from "../database/models/user.model";
export enum Role {
    USER = 'user',
    ADMINISTRATOR = 'administrator'
}
export interface AuthenticateUser {
    id: string | Types.ObjectId;
    accountType?: AccountType | undefined;
    businessProfileID?: string | Types.ObjectId;
    role: Role,
}

export type MongoID = Types.ObjectId | string;







