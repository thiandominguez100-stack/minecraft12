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


test("placing a solid barrier dries water that is no longer connected to a source",()=>{
  const world=new FakeWorld();makeFloor(world,-2,6);
  const fluid=new WaterSimulation(world);
  fluid.addSource(0,1,0);
  for(let x=1;x<=3;x++){
    world.set(x,1,0,"water");
    fluid.levels.set(key(x,1,0),{level:x,falling:false,source:false});
  }
  const previous=world.get(1,1,0);
  world.set(1,1,0,"stone");
  fluid.onBlocksChanged([[1,1,0,previous,"stone"]]);
  assert.equal(world.get(0,1,0),"water");
  assert.equal(world.get(1,1,0),"stone");
  assert.equal(world.get(2,1,0),null);
  assert.equal(world.get(3,1,0),null);
});

test("breaking a block under a source wakes the water and starts a fall",()=>{
  const world=new FakeWorld();
  world.set(0,0,0,"stone");
  const fluid=new WaterSimulation(world,{tickInterval:.1,updateBudget:100});
  fluid.addSource(0,1,0);
  const previous=world.get(0,0,0);
  world.set(0,0,0,null);
  fluid.onBlocksChanged([[0,0,0,previous,null]]);
  fluid.update(.1);
  assert.equal(world.get(0,0,0),"water");
});

test("a source overwritten by a solid block is removed from the source registry",()=>{
  const world=new FakeWorld();makeFloor(world,-2,4);
  const fluid=new WaterSimulation(world);
  fluid.addSource(0,1,0);
  const previous=world.get(0,1,0);
  world.set(0,1,0,"stone");
  fluid.onBlocksChanged([[0,1,0,previous,"stone"]]);
  assert.deepEqual(fluid.exportSources(),[]);
  assert.equal(world.get(0,1,0),"stone");
});

test("water sources refuse to overwrite solid blocks",()=>{
 const world=new FakeWorld();world.set(0,1,0,"stone");const fluid=new WaterSimulation(world);
 assert.equal(fluid.addSource(0,1,0),false);assert.equal(world.get(0,1,0),"stone");
});

test("a supported pool settles into horizontal flow and preserves its source",()=>{
 const world=new FakeWorld();makeFloor(world,-12,12);
 const fluid=new WaterSimulation(world,{tickInterval:.1,updateBudget:1000});
 fluid.addSource(0,1,0);
 for(let i=0;i<14;i++)fluid.update(.1);
 assert.equal(world.get(0,1,0),"water");
 assert.equal(fluid.levels.get(key(0,1,0)).source,true);
 assert.equal(fluid.levels.get(key(0,1,0)).falling,false);
 assert.ok(fluid.levels.get(key(1,1,0)).settled);
 assert.equal(world.get(1,0,0),"stone");
});
test("water above an open cell falls and becomes supported at the next floor",()=>{
 const world=new FakeWorld();world.set(0,0,0,"stone");
 const fluid=new WaterSimulation(world,{tickInterval:.1,updateBudget:100});
 fluid.addSource(0,2,0);fluid.update(.1);
 assert.equal(world.get(0,1,0),"water");
 assert.equal(fluid.levels.get(key(0,1,0)).falling,true);
 fluid.update(.1);
 assert.equal(world.get(0,1,0),"water");
 assert.equal(fluid.levels.get(key(0,1,0)).settled,true);
});

test("flow mesh rebuilds are spread across updates instead of rebuilding every changed chunk at once",()=>{
 const world=new FakeWorld();makeFloor(world,12,19);
 const fluid=new WaterSimulation(world,{tickInterval:.1,updateBudget:1000,maxChunkRebuildsPerFrame:1});
 fluid.addSource(15,1,15);world.rebuilt.length=0;
 fluid.update(.1);
 assert.ok(world.rebuilt.length<=1);
 assert.ok(fluid.pendingChunks.size>=1);
 let flushes=0;
 while(fluid.pendingChunks.size&&flushes<20){
  const before=world.rebuilt.length;
  fluid.flushRebuilds(1);
  assert.ok(world.rebuilt.length-before<=1);
  flushes++;
 }
 assert.equal(fluid.pendingChunks.size,0);
});

test("generated non-source water initializes as supported and settled",()=>{
 const world=new FakeWorld();makeFloor(world,-2,2);
 world.set(0,1,0,"water");world.set(0,2,0,"water");
 const fluid=new WaterSimulation(world,{tickInterval:.1,updateBudget:1});
 assert.equal(fluid.levels.get(key(0,1,0)).settled,true);
 assert.equal(fluid.levels.get(key(0,2,0)).settled,true);
 assert.equal(fluid.levels.get(key(0,2,0)).falling,false);
});
