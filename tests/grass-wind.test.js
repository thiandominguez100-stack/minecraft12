import test from "node:test";
import assert from "node:assert/strict";
import {createGrassBladeLayout,windStrengthForWeather,patchGrassWindShader} from "../src/grass-wind.js";
const cells=[{x:0,y:0,z:0,id:"grass"},{x:1,y:0,z:0,id:"grass"},{x:0,y:-1,z:0,id:"grass"},{x:0,y:0,z:1,id:"dirt"}];
test("each exposed grass tile gets four deterministic wind-blown blades",()=>{
 const a=createGrassBladeLayout(1234,cells),b=createGrassBladeLayout(1234,cells);
 assert.deepEqual(a,b);assert.equal(a.length,8);
 assert.ok(a.every(blade=>blade.y===.505&&blade.height>=.52&&blade.height<=1));
 assert.ok(a.every(blade=>blade.x>=0&&blade.x<=2&&blade.z>=0&&blade.z<=2));
});
test("grass layout changes with world seed so distant fields do not repeat mechanically",()=>{assert.notDeepEqual(createGrassBladeLayout(1,cells),createGrassBladeLayout(2,cells));});
test("wind strengthens during rain and varies smoothly over time",()=>{
 const calm=windStrengthForWeather("clear",0),breeze=windStrengthForWeather("clear",5),storm=windStrengthForWeather("rain",0);
 assert.ok(calm>.29&&calm<.36);assert.ok(breeze>.29&&breeze<.36);assert.ok(storm>calm);
});
test("wind shader injects time and instance-position based blade sway",()=>{
 const uniforms={time:{value:0},strength:{value:.3}},shader={uniforms:{},vertexShader:"#include <common>\nvoid main(){\n#include <begin_vertex>\n}"};
 patchGrassWindShader(shader,uniforms);
 assert.equal(shader.uniforms.uWindTime,uniforms.time);assert.equal(shader.uniforms.uWindStrength,uniforms.strength);
 assert.match(shader.vertexShader,/instanceMatrix\[3\]\.x/);assert.match(shader.vertexShader,/bladeHeight \* bladeHeight/);
});
test("unknown Three.js shader layouts fail visibly instead of silently disabling the wind",()=>{
 const shader={uniforms:{},vertexShader:"void main(){ vec3 transformed=position; }"};
 assert.throws(()=>patchGrassWindShader(shader,{}),/common chunk/);
});
