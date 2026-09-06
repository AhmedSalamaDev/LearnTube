import type { Request } from "express";
import type { User } from "../db/schema.ts";

export interface RequestWithUser extends Request {
  user?: User;
}
