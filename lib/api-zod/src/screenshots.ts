import * as zod from "zod";

export const CreateScreenshotBody = zod.object({
  tradeId: zod.number().int().positive(),
  imageUrl: zod.string().url(),
  imagePath: zod.string().min(1),
  imageType: zod.enum(["before", "during", "after"]),
});

export const DeleteScreenshotParams = zod.object({
  id: zod.coerce.number().int().positive(),
});
