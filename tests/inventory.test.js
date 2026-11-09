import test from "node:test";
import assert from "node:assert/strict";
import {Inventory} from "../src/inventory.js";

test("stacks items across slots and removes an exact amount",()=>{
  const inv=new Inventory("survival");
  inv.add("stone",70);
  assert.equal(inv.count("stone"),70);
  assert.equal(inv.slots[0].count,64);
  assert.equal(inv.slots[1].count,6);
  assert.equal(inv.remove("stone",65),true);
  assert.equal(inv.count("stone"),5);
});

test("crafts planks from a log",()=>{
  const inv=new Inventory("survival");
  inv.add("oak_log",1);
  const result=inv.craft("planks");
  assert.equal(result.ok,true);
  assert.equal(inv.count("oak_log"),0);
  assert.equal(inv.count("oak_planks"),4);
});

test("table recipes require a crafting table",()=>{
  const inv=new Inventory("survival");
  inv.add("oak_planks",3);
  inv.add("stick",2);
  assert.equal(inv.craft("wooden_pickaxe").ok,false);
  inv.add("crafting_table",1);
  assert.equal(inv.craft("wooden_pickaxe").ok,true);
  assert.equal(inv.count("wooden_pickaxe"),1);
});

test("creative crafting keeps ingredients and creates the output",()=>{
  const inv=new Inventory("creative");
  inv.slots[0]={id:"oak_log",count:64};
  assert.equal(inv.craft("planks").ok,true);
  assert.equal(inv.count("oak_log"),64);
  assert.equal(inv.count("oak_planks"),4);
});

test("tools have single-item stacks and lose durability",()=>{
  const inv=new Inventory("survival");
  inv.add("wooden_pickaxe",1);
  assert.equal(inv.count("wooden_pickaxe"),1);
  inv.damageSelected(60);
  assert.equal(inv.count("wooden_pickaxe"),0);
});

test("canFit checks stack room and free inventory slots before crafting",()=>{
 const inv=new Inventory("survival");
 assert.equal(inv.canFit("oak_planks",4),true);
 inv.slots=Array.from({length:36},()=>({id:"stone",count:64}));
 assert.equal(inv.canFit("oak_planks",1),false);
 inv.slots[0]={id:"oak_planks",count:63};
 assert.equal(inv.canFit("oak_planks",1),true);
});
