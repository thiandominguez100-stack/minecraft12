import test from "node:test";
import assert from "node:assert/strict";
import {findSafeSpawn} from "../src/spawn.js";
const key=(x,y,z)=>x+","+y+","+z;
function worldWith(entries=[]){
 const blocks=new Map(entries.map(([x,y,z,id])=>[key(x,y,z),id]));
 return {
  get:(x,y,z)=>blocks.get(key(x,y,z))??null,
  highest:(x,z)=>{for(let y=32;y>=-5;y--){const id=blocks.get(key(x,y,z));if(id&&id!=="water"&&id!=="leaves"&&id!=="torch")return y;}return 2;}
 };
}
test("spawn avoids a flooded origin and selects the nearest clear grass surface",()=>{
 const world=worldWith([[0,3,0,"sand"],[0,4,0,"water"],[2,3,0,"grass"]]);
 assert.deepEqual(findSafeSpawn(world),{x:2,y:5.12,z:0});
});
test("spawn skips grass covered by tree leaves or solid blocks",()=>{
 const world=worldWith([[0,3,0,"grass"],[0,4,0,"leaves"],[2,3,0,"grass"],[2,4,0,"stone"]]);
 assert.deepEqual(findSafeSpawn(world),{x:0,y:5.12,z:2});
});
test("spawn prefers grass over sand when both are at the same search radius",()=>{
 const world=worldWith([[2,3,0,"sand"],[-2,3,0,"grass"]]);
 const spawn=findSafeSpawn(world);
 assert.equal(spawn.x,-2);assert.equal(spawn.y,5.12);
});
test("spawn falls back to origin only when no dry clear surface exists",()=>{
 const world=worldWith([[0,3,0,"stone"]]);
 assert.deepEqual(findSafeSpawn(world,0,0,4),{x:0,y:5.12,z:0});
});
