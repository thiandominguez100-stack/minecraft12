import test from "node:test";
import assert from "node:assert/strict";
import {estimateMobMeshesPerCreature} from "../src/mob-rendering.js";
test("merged animal models use three renderable meshes rather than many body-part meshes",()=>{
 assert.deepEqual(estimateMobMeshesPerCreature(),{body:1,head:1,legs:1,hitbox:0,total:3});
});
