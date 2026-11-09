import test from "node:test";
import assert from "node:assert/strict";
import {BLOCKS,ITEM_MAP,resolveBlockDrop} from "../src/data.js";
import {Inventory} from "../src/inventory.js";
test("every breakable block resolves to a valid inventory item",()=>{const blocks=BLOCKS.filter(b=>b.hardness>=0);assert.ok(blocks.length>0);for(const b of blocks){const id=resolveBlockDrop(b.id);assert.ok(id,"missing drop: "+b.id);assert.ok(ITEM_MAP[id],"unregistered drop: "+id);}});
test("unbreakable bedrock and water never produce collectible drops",()=>{assert.equal(resolveBlockDrop("bedrock"),null);assert.equal(resolveBlockDrop("water"),null);});
test("pickup fills existing stacks and preserves leftovers when inventory is full",()=>{const inv=new Inventory("survival");inv.add("dirt",62);assert.equal(inv.add("dirt",5),0);assert.equal(inv.count("dirt"),67);inv.slots=Array.from({length:36},()=>({id:"stone",count:64}));assert.equal(inv.add("dirt",3),3);});
