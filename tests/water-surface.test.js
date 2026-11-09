import test from "node:test";
import assert from "node:assert/strict";
import {buildWaterSurface,waterCornerY,waterSurfaceY} from "../src/water-surface.js";

const key=(x,y,z)=>x+","+y+","+z;
class SurfaceWorld{
  constructor(){this.blocks=new Map();this.waterSources=new Set();this.waterStates=new Map();}
  get(x,y,z){return this.blocks.get(key(x,y,z))||null;}
  isSolid(x,y,z){const id=this.get(x,y,z);return !!id&&id!=="water"&&id!=="leaves"&&id!=="torch";}
  set(x,y,z,id){if(id)this.blocks.set(key(x,y,z),id);else this.blocks.delete(key(x,y,z));}
}

test("adjacent water cells share one connected surface without internal side faces",()=>{
  const world=new SurfaceWorld();
  world.set(0,0,0,"stone");world.set(1,0,0,"stone");
  world.set(0,1,0,"water");world.set(1,1,0,"water");
  world.waterSources.add(key(0,1,0));world.waterSources.add(key(1,1,0));
  const mesh=buildWaterSurface(world,[[0,1,0],[1,1,0]]);
  assert.equal(mesh.topFaces,2);
  assert.equal(mesh.sideFaces,6,"the shared internal wall must not be rendered");
  assert.ok(mesh.positions.length>0);
});

test("neighboring water cells use the exact same corner height",()=>{
  const world=new SurfaceWorld();
  world.set(0,1,0,"water");world.set(1,1,0,"water");
  world.waterSources.add(key(0,1,0));
  world.waterStates.set(key(0,1,0),{level:0,falling:false,source:true});
  world.waterStates.set(key(1,1,0),{level:7,falling:false,source:false});
  const fromWest=waterCornerY(world,.5,1,.5);
  const fromEast=waterCornerY(world,.5,1,.5);
  assert.equal(fromWest,fromEast);
  assert.ok(fromWest<1.5&&fromWest>1.0);
});

test("flow level changes the visible surface height",()=>{
  const world=new SurfaceWorld();
  world.set(0,1,0,"water");
  world.waterStates.set(key(0,1,0),{level:1,falling:false,source:false});
  const full=waterSurfaceY(world,0,1,0);
  world.waterStates.set(key(0,1,0),{level:7,falling:false,source:false});
  const shallow=waterSurfaceY(world,0,1,0);
  assert.ok(shallow<full);
});

test("water below another water cell has no exposed top face",()=>{
  const world=new SurfaceWorld();
  world.set(0,1,0,"water");world.set(0,2,0,"water");world.set(0,0,0,"stone");
  const mesh=buildWaterSurface(world,[[0,1,0],[0,2,0]]);
  assert.equal(mesh.topFaces,1);
});

test("water side faces are hidden against solid blocks",()=>{
  const world=new SurfaceWorld();
  world.set(0,1,0,"water");world.set(-1,1,0,"stone");
  const mesh=buildWaterSurface(world,[[0,1,0]]);
  assert.equal(mesh.sideFaces,3);
});
