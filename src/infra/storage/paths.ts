import { randomUUID } from "crypto";

const UUID_PATTERN =
  "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Server-generated object key for a user's upload: `<userId>/<uuid>.pdf`. */
export const buildUserPdfPath = (userId: string) =>
  `${userId}/${randomUUID()}.pdf`;

/**
 * True only for paths of the exact shape produced by buildUserPdfPath for
 * this user. This rejects other users' folders, traversal (`..`), leading
 * slashes and arbitrary names.
 */
export const isUserPdfPath = (path: string, userId: string) =>
  new RegExp(`^${escapeRegExp(userId)}/${UUID_PATTERN}\\.pdf$`).test(path);
