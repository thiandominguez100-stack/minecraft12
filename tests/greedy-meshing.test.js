import test from "node:test";
import assert from "node:assert/strict";
import {greedyMeshChunk} from "../src/greedy-meshing.js";
import {BLOCK_MAP} from "../src/data.js";
const key=(x,y,z)=>x+","+y+","+z;
function makeWorld(entries){const blocks=new Map(entries.map(b=>[key(b.x,b.y,b.z),b.id]));return {entries,get:(x,y,z)=>blocks.get(key(x,y,z))||null};}
const block=(x,y,z,id="stone")=>({x,y,z,id});
function quadCount(meshes){return [...meshes.values()].reduce((n,m)=>n+m.quadCount,0);}
test("one isolated voxel emits exactly six visible quads",()=>{
 const w=makeWorld([block(0,0,0)]),m=greedyMeshChunk(w.entries,w.get,BLOCK_MAP);
 assert.equal(quadCount(m),6);assert.equal(m.get("stone").groups.length,6);
 assert.equal(m.get("stone").positions.length,72);assert.equal(m.get("stone").indices.length,36);
});
test("two adjacent identical voxels merge coplanar faces and cull their shared face",()=>{
 const w=makeWorld([block(0,0,0),block(1,0,0)]),m=greedyMeshChunk(w.entries,w.get,BLOCK_MAP);
 assert.equal(quadCount(m),6);assert.equal(m.get("stone").indices.length,36);
});
test("a 4x4 flat floor merges its top into one quad and each outside wall into one quad",()=>{
 const entries=[];for(let x=0;x<4;x++)for(let z=0;z<4;z++)entries.push(block(x,0,z));
 const w=makeWorld(entries),m=greedyMeshChunk(w.entries,w.get,BLOCK_MAP);
 assert.equal(quadCount(m),6);
});
test("coplanar faces of different block materials never merge",()=>{
 const w=makeWorld([block(0,0,0,"stone"),block(1,0,0,"dirt")]),m=greedyMeshChunk(w.entries,w.get,BLOCK_MAP);
 assert.ok(m.has("stone"));assert.ok(m.has("dirt"));assert.equal(quadCount(m),10);
});
test("opaque neighbors hide internal faces while glass and foliage keep cutout boundaries",()=>{
 const a=makeWorld([block(0,0,0,"stone"),block(1,0,0,"glass")]),ma=greedyMeshChunk(a.entries,a.get,BLOCK_MAP);
 assert.equal(ma.get("stone").quadCount,6,"opaque stone remains visible behind transparent glass");assert.equal(ma.get("glass").quadCount,5,"glass face against opaque stone is occluded");
 const b=makeWorld([block(0,0,0,"stone"),block(1,0,0,"leaves")]),mb=greedyMeshChunk(b.entries,b.get,BLOCK_MAP);
 assert.equal(mb.get("stone").quadCount,6);assert.equal(mb.get("leaves").quadCount,5);
});
test("neighboring chunk blocks are consulted so shared faces disappear across chunk borders",()=>{
 const w=makeWorld([block(15,2,0),block(16,2,0)]),m=greedyMeshChunk([block(15,2,0)],w.get,BLOCK_MAP);
 assert.equal(m.get("stone").quadCount,5);
});
test("merged rectangles repeat UV coordinates by their block dimensions",()=>{
 const w=makeWorld([block(0,0,0),block(1,0,0),block(2,0,0)]),m=greedyMeshChunk(w.entries,w.get,BLOCK_MAP).get("stone");
 assert.equal(m.quadCount,6);assert.ok(m.uvs.every(Number.isFinite));assert.ok(Math.max(...m.uvs)>=3);
});
test("mesh groups cover every index exactly once and retain face material indices",()=>{
 const w=makeWorld([block(0,0,0),block(1,0,0)]),m=greedyMeshChunk(w.entries,w.get,BLOCK_MAP).get("stone");
 assert.equal(m.groups.reduce((n,g)=>n+g.count,0),m.indices.length);
 assert.ok(m.groups.every(g=>g.materialIndex>=0&&g.materialIndex<6));
});
