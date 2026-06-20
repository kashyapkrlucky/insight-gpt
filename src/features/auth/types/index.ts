import { BaseEntity } from "@/shared/types";

/**
 * Represents a user in the system
 */
export interface IUser extends BaseEntity {
  /** User's unique identifier */
  id: string;
  /** User's full name */
  name: string;
  /** User's email address (must be unique) */
  email: string;
  /** User's username (must be unique) */
  username: string;
  /** Hashed password (not returned in API responses) */
  password?: string;
  /** URL to the user's avatar image */
  avatar?: string;
  /** Cloudinary public ID for the avatar image */
  avatarId?: string;
  /** User account status */
  status: "active" | "inactive";
}


export type UserFormData = Omit<IUser, 'id'>;   