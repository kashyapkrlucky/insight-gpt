import { z } from "zod";
import { withAuth, parseJsonBody } from "@/shared/lib/api/handler";
import { RATE_LIMITS } from "@/shared/lib/api/rateLimit";
import { MAX_UPLOAD_BYTES } from "@/shared/constants";
import { buildUserPdfPath } from "@/infra/storage/paths";
import { storageServerService } from "@/infra/storage/services/StorageServerService";

const uploadUrlSchema = z.object({
  name: z.string().trim().min(1).max(255),
  size: z.number().int().positive().max(MAX_UPLOAD_BYTES, {
    message: `File must be ${MAX_UPLOAD_BYTES / 1024 / 1024}MB or smaller`,
  }),
  type: z.literal("application/pdf", {
    errorMap: () => ({ message: "Only PDF files are supported" }),
  }),
});

/**
 * Issue a one-time signed upload URL. The server picks the object path, so
 * the client can only write inside its own folder.
 */
export const POST = withAuth(
  async (request, { user }) => {
    await parseJsonBody(request, uploadUrlSchema);

    const { path, token } = await storageServerService.createSignedUploadUrl(
      buildUserPdfPath(user.id),
    );

    return Response.json({ path, token });
  },
  { rateLimit: RATE_LIMITS.upload },
);
