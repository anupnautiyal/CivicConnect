import sharp from "sharp";
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export async function normalizeReportPhoto(bytes: Buffer): Promise<Buffer> {
 if (!bytes.length || bytes.length > MAX_PHOTO_BYTES) throw new Error("Photo must be between 1 byte and 5 MB.");
 const input = sharp(bytes,{limitInputPixels:40000000});
 const metadata=await input.metadata();
 if(!metadata.format||!["jpeg","png","webp"].includes(metadata.format)|| (metadata.pages??1)>1)
  throw new Error("Use a still JPEG, PNG, or WebP image.");
 return input.rotate().resize({width:1920,height:1920,fit:"inside",withoutEnlargement:true}).jpeg({quality:82}).toBuffer();
}
