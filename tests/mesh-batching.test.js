import test from "node:test";
import assert from "node:assert/strict";
import {batchGreedyMeshes} from "../src/mesh-batching.js";
const quad=(face=0)=>({positions:[0,0,0,1,0,0,1,1,0,0,1,0],uvs:[0,0,1,0,1,1,0,1],indices:[0,1,2,0,2,3],groups:[{start:0,count:6,materialIndex:face}],quadCount:1});
const blockMap={stone:{solid:true},dirt:{solid:true},leaves:{solid:true,transparent:true},glass:{solid:true,transparent:true}};
const rects=new Map(["stone","dirt","leaves","glass"].map((id,i)=>[id,Array.from({length:6},(_,face)=>[(i*6+face)/256,0,1/16,1/16])]));
test("all opaque block materials merge into one chunk batch",()=>{
 const result=batchGreedyMeshes(new Map([["stone",quad(0)],["dirt",quad(2)]]),blockMap,rects);
 assert.equal(result.size,1);const batch=result.get("opaque");
 assert.equal(batch.quadCount,2);assert.equal(batch.indices.length,12);assert.equal(batch.positions.length/3,8);
 assert.equal(batch.atlasRects.length/4,8);assert.deepEqual(new Set(batch.blockTypes),new Set(["stone","dirt"]));
});
test("cutout foliage and translucent glass use separate material batches",()=>{
 const result=batchGreedyMeshes(new Map([["stone",quad()],["leaves",quad()],["glass",quad()]]),blockMap,rects);
 assert.deepEqual(new Set(result.keys()),new Set(["opaque","cutout","glass"]));
 assert.equal(result.get("cutout").quadCount,1);assert.equal(result.get("glass").quadCount,1);
});
test("atlas rectangles are assigned to every quad vertex based on the material face",()=>{
 const result=batchGreedyMeshes(new Map([["stone",quad(4)]]),blockMap,rects).get("opaque");
 assert.equal(result.atlasRects.length,16);
 assert.ok(result.atlasRects.every(Number.isFinite));
 assert.equal(result.atlasRects[0],rects.get("stone")[4][0]);
});
test("combined batches offset indices without losing triangle references",()=>{
 const result=batchGreedyMeshes(new Map([["stone",quad()],["dirt",quad()]]),blockMap,rects).get("opaque");
 assert.deepEqual(result.indices,[0,1,2,0,2,3,4,5,6,4,6,7]);
});
