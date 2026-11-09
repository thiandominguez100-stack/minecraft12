import test from "node:test";
import assert from "node:assert/strict";
import {BLOCKS} from "../src/data.js";
import {BLOCK_TEXTURE_SIZE,BLOCK_TEXTURE_PROFILES} from "../src/textures.js";

test("every block has a custom 64 by 64 texture profile",()=>{
  assert.equal(BLOCK_TEXTURE_SIZE,64);
  for(const block of BLOCKS)assert.ok(BLOCK_TEXTURE_PROFILES[block.id],"missing texture design for "+block.id);
  assert.equal(Object.keys(BLOCK_TEXTURE_PROFILES).length,BLOCKS.length);
});
test("foliage uses an alpha-cut leaf texture profile",()=>{
  assert.match(BLOCK_TEXTURE_PROFILES.leaves,/alpha|foliage/i);
});
