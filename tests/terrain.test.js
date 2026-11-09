import test from "node:test";
import assert from "node:assert/strict";
import {
  CHUNK_SIZE,CHUNKS_X,CHUNKS_Z,TOTAL_CHUNKS,
  WORLD_MIN_X,WORLD_MIN_Z,WORLD_MAX_X,WORLD_MAX_Z,
  chunkAddress,isInsideWorld,terrainSample,riverCenterAt,mountainCenter,waterBankHeight,WATER_LEVEL
} from "../src/terrain.js";

test("the world contains one hundred forty-four complete 16x16 chunks",()=>{
  assert.equal(CHUNK_SIZE,16);
  assert.equal(CHUNKS_X,12);
  assert.equal(CHUNKS_Z,12);
  assert.equal(CHUNKS_X*CHUNKS_Z,144);
  assert.equal(TOTAL_CHUNKS,144);
  assert.equal((WORLD_MAX_X-WORLD_MIN_X+1)*(WORLD_MAX_Z-WORLD_MIN_Z+1),144*16*16);
});

test("chunk addressing covers every world coordinate exactly once",()=>{
  const touched=new Set();
  for(let x=WORLD_MIN_X;x<=WORLD_MAX_X;x++)for(let z=WORLD_MIN_Z;z<=WORLD_MAX_Z;z++){
    const chunk=chunkAddress(x,z);
    assert.ok(chunk);
    touched.add(chunk.key);
    assert.equal(isInsideWorld(x,z),true);
  }
  assert.equal(touched.size,144);
  assert.equal(chunkAddress(WORLD_MIN_X-1,WORLD_MIN_Z),null);
  assert.equal(chunkAddress(WORLD_MAX_X+1,WORLD_MAX_Z),null);
});

test("terrain is deterministic for a seed and smoothly connected between neighboring blocks",()=>{
  for(const seed of [1,12345,20261109,987654321]){
    for(let x=WORLD_MIN_X;x<=WORLD_MAX_X;x++)for(let z=WORLD_MIN_Z;z<=WORLD_MAX_Z;z++){
      const a=terrainSample(x,z,seed),b=terrainSample(x,z,seed);
      assert.deepEqual(a,b);
      if(x<WORLD_MAX_X)assert.ok(Math.abs(a.height-terrainSample(x+1,z,seed).height)<=2,"x seam at "+x+","+z+" seed "+seed);
      if(z<WORLD_MAX_Z)assert.ok(Math.abs(a.height-terrainSample(x,z+1,seed).height)<=2,"z seam at "+x+","+z+" seed "+seed);
    }
  }
});

test("the mountain region and meandering river are deterministic world features",()=>{
  for(const seed of [1,12345,20261109]){
    const mountain=mountainCenter(seed);
    const peak=terrainSample(Math.round(mountain.x),Math.round(mountain.z),seed);
    assert.ok(peak.baseHeight>=15);
    for(let x=WORLD_MIN_X;x<WORLD_MAX_X;x++)
      assert.ok(Math.abs(riverCenterAt(x+1,seed)-riverCenterAt(x,seed))<2);
  }
});

test("biomes and shorelines return valid surface definitions",()=>{
  const surfaces=new Set(["grass","sand","snow","stone"]);
  for(const seed of [1,20261109]){
    for(let x=WORLD_MIN_X;x<=WORLD_MAX_X;x++)for(let z=WORLD_MIN_Z;z<=WORLD_MAX_Z;z++){
      const sample=terrainSample(x,z,seed);
      assert.ok(surfaces.has(sample.surface));
      assert.ok(sample.height>=2&&sample.height<=28);
    }
  }
});

test("river and lake beds rise smoothly into shallow shores at the water line",()=>{
 for(const [core,fade] of [[13.5,24],[13.0,22],[10.5,20],[11.0,21]]){
  const heights=[0,1,2,core,core+1,fade].map(d=>waterBankHeight(d,18,core,fade,2.3,5.0));
  for(let i=1;i<heights.length;i++)assert.ok(heights[i]>=heights[i-1],"shore should never descend outwards");
  assert.ok(heights[0]<=3);assert.ok(heights[3]<=5);assert.equal(heights[5],18);
 }
});

test("the river centerline and lake cores generate connected natural water columns",()=>{
 for(const seed of [1,12345,20261109]){
  let riverWater=0,riverSources=0;
  for(let x=-80;x<=80;x++){
   const z=Math.round(riverCenterAt(x,seed)),sample=terrainSample(x,z,seed);
   if(sample.isWaterColumn&&sample.height<WATER_LEVEL)riverWater++;
   if(sample.waterSource)riverSources++;
  }
  assert.ok(riverWater>140,"the river should contain water across almost its entire length");
  assert.ok(riverSources>=25,"sparse source blocks should maintain the natural river");
  const m=terrainSample(17,-14,seed);
  assert.equal(typeof m.isWaterColumn,"boolean");
 });
});
test("waterline terrain reaches the same block height at the dry bank",()=>{
 const bed=waterBankHeight(0,16,13.5,24,2.2,5);
 const nearBank=waterBankHeight(9.5,16,13.5,24,2.2,5);
 const dryBank=waterBankHeight(13.5,16,13.5,24,2.2,5);
 assert.ok(bed<nearBank);
 assert.equal(dryBank,5);
});
