import test from "node:test";
import assert from "node:assert/strict";
import {buildWaterSurface,waterCornerY,waterSurfaceY} from "../src/water-surface.js";
const GRID=4,key=(x,y,z)=>x+","+y+","+z;
class SurfaceWorld{
 constructor(){this.blocks=new Map();this.waterSources=new Set();this.waterStates=new Map();}
 get(x,y,z){return this.blocks.get(key(x,y,z))||null;}
 isSolid(x,y,z){const id=this.get(x,y,z);return !!id&&id!=="water"&&id!=="leaves"&&id!=="torch";}
 set(x,y,z,id){if(id)this.blocks.set(key(x,y,z),id);else this.blocks.delete(key(x,y,z));}
}
test("neighboring water cells share a surface without internal walls",()=>{
 const w=new SurfaceWorld();w.set(0,0,0,"stone");w.set(1,0,0,"stone");w.set(0,1,0,"water");w.set(1,1,0,"water");w.waterSources.add(key(0,1,0));w.waterSources.add(key(1,1,0));
 const mesh=buildWaterSurface(w,[[0,1,0],[1,1,0]]);
 assert.equal(mesh.topFaces,2);assert.equal(mesh.sideFaces,6);assert.equal(mesh.waveWeights.length,mesh.positions.length/3);assert.ok(mesh.indices.length>2*GRID*GRID*6);
});
test("adjacent fluid levels share the same corner height",()=>{
 const w=new SurfaceWorld();w.set(0,1,0,"water");w.set(1,1,0,"water");w.waterSources.add(key(0,1,0));w.waterStates.set(key(0,1,0),{level:0,source:true});w.waterStates.set(key(1,1,0),{level:7,source:false});
 const a=waterCornerY(w,.5,1,.5),b=waterCornerY(w,.5,1,.5);assert.equal(a,b);assert.ok(a<1.5&&a>1);
});
test("flow level changes surface height",()=>{
 const w=new SurfaceWorld();w.set(0,1,0,"water");w.waterStates.set(key(0,1,0),{level:1});const full=waterSurfaceY(w,0,1,0);w.waterStates.set(key(0,1,0),{level:7});assert.ok(waterSurfaceY(w,0,1,0)<full);
});
test("water below another water cell has no top face",()=>{
 const w=new SurfaceWorld();w.set(0,1,0,"water");w.set(0,2,0,"water");w.set(0,0,0,"stone");assert.equal(buildWaterSurface(w,[[0,1,0],[0,2,0]]).topFaces,1);
});
test("water hides its side against solid blocks",()=>{
 const w=new SurfaceWorld();w.set(0,1,0,"water");w.set(-1,1,0,"stone");assert.equal(buildWaterSurface(w,[[0,1,0]]).sideFaces,3);
});

test("a calm source pool keeps a level waterline and only flowing cells slope",()=>{
 const w=new SurfaceWorld();w.set(0,1,0,"water");w.set(1,1,0,"water");
 w.waterSources.add(key(0,1,0));w.waterStates.set(key(0,1,0),{level:0,source:true,falling:false});
 w.waterStates.set(key(1,1,0),{level:1,source:false,falling:false});
 assert.equal(waterSurfaceY(w,0,1,0),1.5);assert.equal(waterSurfaceY(w,1,1,0),1.5);
 w.waterStates.set(key(1,1,0),{level:5,source:false,falling:false});
 assert.ok(waterSurfaceY(w,1,1,0)<waterSurfaceY(w,0,1,0));
});
