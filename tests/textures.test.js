import test from "node:test";
import assert from "node:assert/strict";
import {BLOCKS} from "../src/data.js";
import {BLOCK_TEXTURE_SIZE,BLOCK_TEXTURE_PROFILES,blockMaterialSettings} from "../src/texture-spec.js";

test("every block has a custom 64 by 64 texture profile",()=>{
  assert.equal(BLOCK_TEXTURE_SIZE,64);
  for(const block of BLOCKS)assert.ok(BLOCK_TEXTURE_PROFILES[block.id],"missing texture design for "+block.id);
  assert.equal(Object.keys(BLOCK_TEXTURE_PROFILES).length,BLOCKS.length);
});
test("foliage uses an alpha-cut leaf texture profile",()=>{
  assert.match(BLOCK_TEXTURE_PROFILES.leaves,/alpha|foliage/i);
});

test("leaf blocks use opaque alpha-cut rendering so the first-person hand is not covered",()=>{
 const leaves=blockMaterialSettings("leaves");
 assert.equal(leaves.transparent,false);
 assert.equal(leaves.depthWrite,true);
 assert.ok(leaves.alphaTest>=.4);
});
test("glass remains transparent while ordinary blocks stay opaque",()=>{
 assert.equal(blockMaterialSettings("glass").transparent,true);
 assert.equal(blockMaterialSettings("stone").transparent,false);
});
