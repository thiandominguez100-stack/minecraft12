import test from "node:test";
import assert from "node:assert/strict";
import {buildWaterSurface,waterCornerY,waterSurfaceY,waterWaveHeight} from "../src/water-surface.js";
const GRID=2,key=(x,y,z)=>x+","+y+","+z;
class SurfaceWorld{
 constructor(){this.blocks=new Map();this.waterSources=new Set();this.waterStates=new Map();}
 get(x,y,z){return this.blocks.get(key(x,y,z))||null;}
 isSolid(x,y,z){const id=this.get(x,y,z);return !!id&&id!=="water"&&id!=="leaves"&&id!=="torch";}
 set(x,y,z,id){if(id)this.blocks.set(key(x,y,z),id);else this.blocks.delete(key(x,y,z));}
}
test("neighboring water cells share a surface without internal walls",()=>{
 const w=new SurfaceWorld();w.set(0,0,0,"stone");w.set(1,0,0,"stone");w.set(0,1,0,"water");w.set(1,1,0,"water");w.waterSources.add(key(0,1,0));w.waterSources.add(key(1,1,0));
 const mesh=buildWaterSurface(w,[[0,1,0],[1,1,0]]);
 assert.equal(mesh.topFaces,2);assert.equal(mesh.sideFaces,6);assert.equal(mesh.positions.length/3,mesh.uvs.length/2);assert.ok(mesh.indices.length>2*6);
});
test("adjacent fluid levels share the same corner height",()=>{
 const w=new SurfaceWorld();w.set(0,1,0,"water");w.set(1,1,0,"water");w.waterSources.add(key(0,1,0));w.waterStates.set(key(0,1,0),{level:0,source:true});w.waterStates.set(key(1,1,0),{level:7,source:false});
 const a=waterCornerY(w,.5,1,.5),b=waterCornerY(w,.5,1,.5);assert.equal(a,b);assert.equal(a,1.512);
});
test("water surface remains flat while physical flow level is stored separately",()=>{
 const w=new SurfaceWorld();w.set(0,1,0,"water");w.waterStates.set(key(0,1,0),{level:1,falling:false});
 const full=waterSurfaceY(w,0,1,0);w.waterStates.set(key(0,1,0),{level:7,falling:false});
 assert.equal(waterSurfaceY(w,0,1,0),full);
 assert.equal(w.waterStates.get(key(0,1,0)).level,7);
});
test("water below another water cell has no top face",()=>{
 const w=new SurfaceWorld();w.set(0,1,0,"water");w.set(0,2,0,"water");w.set(0,0,0,"stone");assert.equal(buildWaterSurface(w,[[0,1,0],[0,2,0]]).topFaces,1);
});
test("water hides its side against solid blocks",()=>{
 const w=new SurfaceWorld();w.set(0,1,0,"water");w.set(-1,1,0,"stone");assert.equal(buildWaterSurface(w,[[0,1,0]]).sideFaces,3);
});

test("a calm source pool keeps a level waterline while flow state remains separate",()=>{
 const w=new SurfaceWorld();w.set(0,1,0,"water");w.set(1,1,0,"water");
 w.waterSources.add(key(0,1,0));w.waterStates.set(key(0,1,0),{level:0,source:true,falling:false});
 w.waterStates.set(key(1,1,0),{level:1,source:false,falling:false,settled:true});
 assert.equal(waterSurfaceY(w,0,1,0),1.512);assert.equal(waterSurfaceY(w,1,1,0),1.512);
 w.waterStates.set(key(1,1,0),{level:5,source:false,falling:false,settled:false});
 assert.equal(waterSurfaceY(w,1,1,0),waterSurfaceY(w,0,1,0));
});

test("calm supported water renders as a flat continuous surface",()=>{
 const w=new SurfaceWorld();w.set(0,1,0,"water");w.set(1,1,0,"water");
 w.waterStates.set(key(0,1,0),{level:1,source:false,falling:false,settled:true});
 w.waterStates.set(key(1,1,0),{level:1,source:false,falling:false,settled:true});
 const surface=buildWaterSurface(w,[[0,1,0],[1,1,0]]);
 assert.ok(surface.positions.length>0);
 assert.equal(surface.topFaces,2);
 assert.equal(surface.sideFaces,6);
});

test("new water renderer always builds an upward-facing blue-water surface for an exposed cell",()=>{
 const w=new SurfaceWorld();w.set(0,0,0,"sand");w.set(0,1,0,"water");
 const mesh=buildWaterSurface(w,[[0,1,0]]);
 assert.equal(mesh.topFaces,1);
 assert.equal(mesh.sideFaces,4);
 assert.ok(mesh.positions.some((v,i)=>i%3===1&&v>1.5));
 assert.equal(mesh.indices.length,78);assert.equal(mesh.waveWeights.length,mesh.positions.length/3);
});
test("adjacent water cells share the same exact surface height without a seam",()=>{
 const w=new SurfaceWorld();w.set(0,1,0,"water");w.set(1,1,0,"water");
 const a=waterSurfaceY(w,0,1,0),b=waterSurfaceY(w,1,1,0);
 assert.equal(a,b);assert.equal(a,1.512);
 const mesh=buildWaterSurface(w,[[0,1,0],[1,1,0]]);
 assert.equal(mesh.topFaces,2);assert.equal(mesh.sideFaces,6);
});

test("water surface is subdivided into a moving wave mesh",()=>{
 const w=new SurfaceWorld();w.set(0,1,0,"water");
 const mesh=buildWaterSurface(w,[[0,1,0]]);
 assert.equal(mesh.topFaces,1);
 assert.ok(mesh.waveWeights.filter(v=>v===1).length>=16);
 assert.equal(waterWaveHeight(1,1,0,1),waterWaveHeight(1,1,0,1));
 assert.notEqual(waterWaveHeight(1,1,0,1),waterWaveHeight(1,1,1,1));
 assert.ok(Math.abs(waterWaveHeight(1,1,1,1))<.034);
});
test("the lowered waterline remains exactly one block below the previous level",()=>{
 assert.equal(waterSurfaceY(new SurfaceWorld(),0,4,0),4.512);
});
