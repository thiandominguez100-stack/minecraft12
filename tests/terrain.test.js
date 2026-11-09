import test from "node:test";
import assert from "node:assert/strict";
import {CHUNK_SIZE,CHUNKS_X,CHUNKS_Z,TOTAL_CHUNKS,WORLD_MIN_X,WORLD_MAX_X,chunkAddress,chunksInRadius,isInsideWorld,terrainSample,hash} from "../src/terrain.js";
test("the meadow has infinite chunk dimensions and standard 16x16 chunk cells",()=>{
 assert.equal(CHUNK_SIZE,16);assert.equal(CHUNKS_X,Infinity);assert.equal(CHUNKS_Z,Infinity);assert.equal(TOTAL_CHUNKS,Infinity);
 assert.equal(WORLD_MIN_X,-Infinity);assert.equal(WORLD_MAX_X,Infinity);
});
test("chunk addressing continues without bounds in positive and negative directions",()=>{
 for(const [x,z] of [[-1000000,-1000000],[-17,-17],[-16,-16],[-1,-1],[0,0],[15,15],[16,16],[1000000,1000000]]){
  const c=chunkAddress(x,z);assert.ok(c);assert.equal(c.ix,Math.floor(x/16));assert.equal(c.iz,Math.floor(z/16));assert.equal(isInsideWorld(x,z),true);
 }
 assert.equal(chunkAddress(Infinity,0),null);assert.equal(isInsideWorld(NaN,0),false);
});
test("streaming radius returns nearby chunks only and stays centered at negative coordinates",()=>{
 const chunks=chunksInRadius(-16,32,2.1),keys=new Set(chunks.map(c=>c.key));
 assert.ok(keys.has("-1,2"));assert.ok(keys.has("-3,2"));assert.ok(keys.has("-1,4"));assert.ok(!keys.has("-4,2"));
 assert.ok(chunks.every(c=>c.distance<=2.1));
});
test("every coordinate samples the same flat, waterless grassland",()=>{
 for(const seed of [1,12345,20261109,987654321])for(const [x,z] of [[0,0],[-90000,21000],[160000,-340000],[17,16]]){
  const s=terrainSample(x,z,seed);assert.equal(s.height,0);assert.equal(s.baseHeight,0);assert.equal(s.surface,"grass");
  assert.equal(s.biome,"meadow");assert.equal(s.isWaterColumn,false);assert.equal(s.waterSource,false);
 }
});
test("coordinate hashing is repeatable for wind and ground decoration",()=>{assert.equal(hash(15,-22,99),hash(15,-22,99));assert.notEqual(hash(15,-22,99),hash(15,-22,100));});
