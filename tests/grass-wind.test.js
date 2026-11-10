import test from "node:test";
import assert from "node:assert/strict";
import {createGrassBladeBuffers,GRASS_BLADES_MIN,GRASS_BLADES_MAX,windStrengthForWeather,patchGrassWindShader} from "../src/grass-wind.js";

const cells=[
 {x:0,y:0,z:0,id:"grass"},
 {x:1,y:0,z:0,id:"grass"},
 {x:0,y:-1,z:0,id:"grass"},
 {x:0,y:0,z:1,id:"dirt"}
];

test("each exposed grass tile receives dozens of fine deterministic blades",()=>{
 const a=createGrassBladeBuffers(1234,cells),b=createGrassBladeBuffers(1234,cells);
 assert.deepEqual(a,b);
 assert.equal(a.tileCount,2);
 assert.ok(a.count>=GRASS_BLADES_MIN*2&&a.count<=GRASS_BLADES_MAX*2);
 assert.equal(a.matrices.length,a.count*16);
 assert.equal(a.colors.length,a.count*3);
 assert.equal(a.minPerTile,52);
 assert.equal(a.maxPerTile,76);
});

test("grass blade transforms contain finite positions, scale and rotation",()=>{
 const layout=createGrassBladeBuffers(1234,cells);
 for(let i=0;i<layout.count;i++){
  const m=i*16;
  assert.ok(Number.isFinite(layout.matrices[m]));
  assert.ok(Number.isFinite(layout.matrices[m+5])&&layout.matrices[m+5]>=.38&&layout.matrices[m+5]<=1.04);
  assert.ok(layout.matrices[m+15]===1);
 }
 assert.ok([...layout.colors].every(v=>Number.isFinite(v)&&v>=0&&v<=1));
});

test("world seed changes the distribution and appearance of the meadow",()=>{
 assert.notDeepEqual(createGrassBladeBuffers(1,cells),createGrassBladeBuffers(2,cells));
});

test("rain strengthens broad wind gusts and the breeze varies smoothly",()=>{
 const calm=windStrengthForWeather("clear",0),breeze=windStrengthForWeather("clear",5),storm=windStrengthForWeather("rain",0);
 assert.ok(calm>.44&&calm<.54);
 assert.ok(breeze>.44&&breeze<.54);
 assert.ok(storm>calm);
});

test("grass wind shader adds layered travelling waves to instanced blades",()=>{
 const uniforms={time:{value:0},strength:{value:.5}},shader={uniforms:{},vertexShader:"#include <common>\nvoid main(){\n#include <begin_vertex>\n}"};
 patchGrassWindShader(shader,uniforms);
 assert.equal(shader.uniforms.uWindTime,uniforms.time);
 assert.equal(shader.uniforms.uWindStrength,uniforms.strength);
 assert.match(shader.vertexShader,/instanceMatrix\[3\]\.xz/);
 assert.match(shader.vertexShader,/crossingWave/);
 assert.match(shader.vertexShader,/fineFlutter/);
});

test("unknown Three.js shader layouts fail visibly instead of silently disabling wind",()=>{
 const shader={uniforms:{},vertexShader:"void main(){ vec3 transformed=position; }"};
 assert.throws(()=>patchGrassWindShader(shader,{}),/common chunk/);
});
