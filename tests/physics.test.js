import test from "node:test";
import assert from "node:assert/strict";
import {FirstPersonPhysics} from "../src/physics.js";

function flatWorld(){
  return {
    collides(pos){
      const feet=pos.y-1.62,head=feet+1.8;
      return feet<.5-1e-5||head>5.5;
    },
    findGroundSurface(pos,r,maxGap){
      const gap=(pos.y-1.62)-.5;
      return gap>=-.16&&gap<=maxGap ? .5 : null;
    }
  };
}
function player(){return {position:{x:0,y:2.12,z:0},velocity:{x:0,y:0,z:0}};}

test("standing height remains stable without vertical jitter",()=>{
  const physics=new FirstPersonPhysics(),world=flatWorld(),p=player();
  for(let i=0;i<240;i++)physics.update(world,p.position,p.velocity,{x:0,z:0,speed:4.8},1/60);
  assert.equal(physics.onGround,true);
  assert.ok(Math.abs(p.position.y-2.12)<1e-8);
  assert.equal(p.velocity.y,0);
});

test("jump starts immediately after the jump input is queued",()=>{
  const physics=new FirstPersonPhysics(),world=flatWorld(),p=player();
  physics.update(world,p.position,p.velocity,{x:0,z:0,speed:4.8},1/60);
  physics.queueJump();
  physics.update(world,p.position,p.velocity,{x:0,z:0,speed:4.8},1/60);
  assert.ok(p.velocity.y>8);
  assert.ok(p.position.y>2.12);
  assert.equal(physics.onGround,false);
});

test("a new jump is available as soon as the player lands",()=>{
  const physics=new FirstPersonPhysics(),world=flatWorld(),p=player();
  physics.update(world,p.position,p.velocity,{x:0,z:0,speed:4.8},1/60);
  physics.queueJump();
  for(let i=0;i<100;i++)physics.update(world,p.position,p.velocity,{x:0,z:0,speed:4.8},1/60);
  assert.equal(physics.onGround,true);
  physics.queueJump();
  physics.update(world,p.position,p.velocity,{x:0,z:0,speed:4.8},1/60);
  assert.ok(p.velocity.y>8);
});

test("water immersion enables buoyancy instead of normal falling",()=>{
  const physics=new FirstPersonPhysics(),world={
    ...flatWorld(),
    getSubmersion:()=>.75
  },p=player();
  physics.update(world,p.position,p.velocity,{x:0,z:0,speed:4.8},1/60);
  assert.equal(physics.inWater,true);
  assert.equal(physics.onGround,false);
  assert.ok(p.velocity.y>0,"buoyancy should push the player upward");
});

test("holding Space gives an upward swimming stroke",()=>{
  const physics=new FirstPersonPhysics(),world={
    ...flatWorld(),
    getSubmersion:()=>.75
  },p=player();
  physics.update(world,p.position,p.velocity,{x:0,z:0,speed:4.8,jump:true},.05);
  assert.equal(physics.inWater,true);
  assert.ok(p.velocity.y>.5,"Space should provide upward swim force");
});

test("horizontal swimming accelerates the player through water",()=>{
  const physics=new FirstPersonPhysics(),world={
    ...flatWorld(),
    getSubmersion:()=>.8
  },p=player();
  physics.update(world,p.position,p.velocity,{x:1,z:0,speed:4.8},.05);
  assert.equal(physics.inWater,true);
  assert.ok(p.velocity.x>0);
  assert.ok(p.position.x>0);
});

test("a quick jump tap produces a distinct swimming stroke",()=>{
  const physics=new FirstPersonPhysics(),world={
    ...flatWorld(),
    getSubmersion:()=>.75
  },p=player();
  physics.queueJump();
  physics.update(world,p.position,p.velocity,{x:0,z:0,speed:4.8,jump:false},1/60);
  assert.equal(physics.inWater,true);
  assert.ok(p.velocity.y>=3.2);
});

test("holding Shift dives below the water surface",()=>{
  const physics=new FirstPersonPhysics(),world={collides:()=>false,findGroundSurface:()=>null,getSubmersion:()=>.85},p=player();
  physics.update(world,p.position,p.velocity,{x:0,z:0,speed:4.8,dive:true},.05);
  assert.equal(physics.inWater,true);
  assert.ok(p.velocity.y<0,"Shift should create downward swimming velocity");
  assert.ok(p.position.y<2.12,"the player should descend");
});
