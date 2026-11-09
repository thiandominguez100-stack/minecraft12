import test from "node:test";
import assert from "node:assert/strict";
import {WaterSimulation} from "../src/fluid.js";
import {BLOCK_MAP} from "../src/data.js";

const key=(x,y,z)=>x+","+y+","+z;
class FakeWorld{
  constructor(){
    this.blocks=new Map();
    this.waterSources=new Set();
    this.rebuilt=[];
  }
  get(x,y,z){return this.blocks.get(key(x,y,z))||null;}
  set(x,y,z,id){
    if(!Number.isInteger(x)||!Number.isInteger(y)||!Number.isInteger(z)||y<-5||y>32)return false;
    if(id)this.blocks.set(key(x,y,z),id);else this.blocks.delete(key(x,y,z));
    return true;
  }
  isSolid(x,y,z){
    const id=this.get(x,y,z);
    return !!id&&id!=="water"&&BLOCK_MAP[id]?.solid!==false;
  }
  rebuildChunk(ix,iz){this.rebuilt.push([ix,iz]);}
}
function makeFloor(world,min=-12,max=12,y=0){
  for(let x=min;x<=max;x++)for(let z=min;z<=max;z++)world.set(x,y,z,"stone");
}

test("water remains a non-solid, unbreakable fluid block",()=>{
  assert.equal(BLOCK_MAP.water.solid,false);
  assert.equal(BLOCK_MAP.water.hardness,-1);
  assert.equal(BLOCK_MAP.water.drop,null);
});

test("a source spreads horizontally with a seven-cell decay limit",()=>{
  const world=new FakeWorld();makeFloor(world);
  const fluid=new WaterSimulation(world,{tickInterval:.1,updateBudget:1000});
  assert.equal(fluid.addSource(0,1,0),true);
  for(let i=0;i<10;i++)fluid.update(.1);
  assert.equal(world.get(7,1,0),"water");
  assert.notEqual(world.get(8,1,0),"water");
  assert.equal(world.get(0,1,0),"water");
});

test("water falls into an open shaft before spreading sideways",()=>{
  const world=new FakeWorld();
  world.set(0,3,0,"water");
  const fluid=new WaterSimulation(world,{tickInterval:.1,updateBudget:1000});
  fluid.restoreSources([[0,3,0]]);
  fluid.update(.1);
  assert.equal(world.get(0,2,0),"water");
  assert.equal(world.get(1,3,0),null);
  fluid.update(.1);
  assert.equal(world.get(0,1,0),"water");
});

test("flow never replaces solid terrain",()=>{
  const world=new FakeWorld();makeFloor(world);
  world.set(1,1,0,"stone");
  const fluid=new WaterSimulation(world,{tickInterval:.1,updateBudget:1000});
  fluid.addSource(0,1,0);
  fluid.update(.1);
  assert.equal(world.get(1,1,0),"stone");
  assert.equal(world.get(-1,1,0),"water");
});

test("source positions can be serialized and restored",()=>{
  const world=new FakeWorld();
  const fluid=new WaterSimulation(world);
  fluid.addSource(2,3,-4);
  assert.deepEqual(fluid.exportSources(),[[2,3,-4]]);
  const restored=new WaterSimulation(world);
  assert.deepEqual(restored.restoreSources([[5,2,1]]).exportSources(),[[2,3,-4],[5,2,1]]);
});
