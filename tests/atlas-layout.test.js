import test from "node:test";
import assert from "node:assert/strict";
import {ATLAS_COLUMNS,ATLAS_ROWS,ATLAS_TILE_SIZE,atlasTileRect} from "../src/atlas-layout.js";
test("block texture atlas layout has enough fixed 64px cells for every face",()=>{
 assert.equal(ATLAS_COLUMNS,16);assert.equal(ATLAS_ROWS,16);assert.equal(ATLAS_TILE_SIZE,64);
 assert.ok(ATLAS_COLUMNS*ATLAS_ROWS>=23*6);
});
test("six faces of one block map to six unique atlas tiles",()=>{
 const rects=Array.from({length:6},(_,face)=>atlasTileRect(0,face));
 assert.equal(new Set(rects.map(r=>r.join(","))).size,6);
 assert.ok(rects.every(r=>r.every(Number.isFinite)));
 assert.ok(rects.every(([x,y,w,h])=>x>=0&&y>=0&&x+w<=1&&y+h<=1));
});
test("different block types cannot share a texture atlas tile",()=>{
 const a=atlasTileRect(0,5),b=atlasTileRect(1,0);
 assert.notDeepEqual(a,b);
 assert.equal(a[0],b[0]);assert.ok(b[1]<a[1]||b[1]>a[1]);
});
test("the atlas rejects invalid face indices and capacity overflow",()=>{
 assert.throws(()=>atlasTileRect(0,6),RangeError);
 assert.throws(()=>atlasTileRect(50,0),RangeError);
});
