import test from "node:test";
import assert from "node:assert/strict";
import {patchAtlasShader} from "../src/atlas-shader.js";

function fixture(){
 return {
  vertexShader:"#include <common>\nvoid main(){\n#include <begin_vertex>\n}",
  fragmentShader:"#include <common>\nvoid main(){\n#include <map_fragment>\n}"
 };
}

test("atlas shader explicitly replaces Three.js map sampling with the selected tile",()=>{
 const shader=patchAtlasShader(fixture());
 assert.match(shader.vertexShader,/attribute vec4 atlasRect/);
 assert.match(shader.vertexShader,/vAtlasRect = atlasRect/);
 assert.match(shader.fragmentShader,/varying vec4 vAtlasRect/);
 assert.match(shader.fragmentShader,/fract\( vMapUv \) \* vAtlasRect\.zw/);
 assert.doesNotMatch(shader.fragmentShader,/#include <map_fragment>/);
});

test("atlas shader refuses unknown Three.js shader layouts instead of displaying the full atlas",()=>{
 const shader=fixture();
 shader.fragmentShader=shader.fragmentShader.replace("#include <map_fragment>","// different map chunk");
 assert.throws(()=>patchAtlasShader(shader),/missing map_fragment/);
});

test("atlas shader validates the shader object",()=>{
 assert.throws(()=>patchAtlasShader(null),TypeError);
});
