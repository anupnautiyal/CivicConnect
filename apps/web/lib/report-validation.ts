import { z } from "zod";
export const reportSchema = z.object({
 id: z.string().uuid(),
 title: z.string().trim().min(5).max(120),
 description: z.string().trim().min(15).max(2000),
 category: z.string().uuid(),
 lat: z.coerce.number().finite().min(-90).max(90),
 lng: z.coerce.number().finite().min(-180).max(180),
 accuracy: z.number().finite().min(0).max(99999).nullable(),
 address: z.string().trim().min(5).max(300)
});
