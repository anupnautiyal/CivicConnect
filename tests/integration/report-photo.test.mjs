import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { normalizeReportPhoto,MAX_PHOTO_BYTES } from "../../apps/web/lib/report-photo.ts";
test("photo normalization bounds dimensions and removes private EXIF metadata",async()=>{
 const original=await sharp({create:{width:2400,height:1200,channels:3,background:"#006b61"}})
 .jpeg().withMetadata({exif:{IFD0:{Artist:"Private test identity"}}}).toBuffer();
 const result=await normalizeReportPhoto(original);
 const metadata=await sharp(result).metadata();
 assert.equal(metadata.format,"jpeg");assert.equal(metadata.width,1920);
 assert.equal(metadata.exif,undefined);assert.ok(result.length<MAX_PHOTO_BYTES);
});
test("photo validation rejects corrupt, oversized and disguised non-photo content",async()=>{
 for(const bytes of [Buffer.from("not an image"),Buffer.alloc(0),Buffer.alloc(MAX_PHOTO_BYTES+1),
 Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>')])
 await assert.rejects(normalizeReportPhoto(bytes));
});
