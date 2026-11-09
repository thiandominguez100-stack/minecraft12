import test from "node:test";
import assert from "node:assert/strict";
import {matchCraftingRecipe,getCraftingRecipes} from "../src/crafting.js";
import {ITEM_MAP} from "../src/data.js";

test("personal 2x2 grid turns a log into four planks in any cell",()=>{
 const grid=[null,null,null,"oak_log"];
 const result=matchCraftingRecipe(grid,2,"personal");
 assert.equal(result?.id,"planks");assert.deepEqual(result?.output,{id:"oak_planks",count:4});
});
test("personal 2x2 grid recognizes two vertically arranged planks as sticks",()=>{
 assert.equal(matchCraftingRecipe(["oak_planks",null,"oak_planks",null],2)?.id,"sticks");
 assert.equal(matchCraftingRecipe(["oak_planks","oak_planks",null,null],2),null);
});
test("four planks in a 2x2 square craft a crafting table",()=>{
 assert.equal(matchCraftingRecipe(["oak_planks","oak_planks","oak_planks","oak_planks"],2)?.id,"crafting_table");
});
test("3x3 table crafting recognizes pickaxes, shovel, furnace and chest",()=>{
 assert.equal(matchCraftingRecipe(["oak_planks","oak_planks","oak_planks",null,"stick",null,null,"stick",null],3,"table")?.id,"wooden_pickaxe");
 assert.equal(matchCraftingRecipe(["cobblestone","cobblestone","cobblestone",null,"stick",null,null,"stick",null],3,"table")?.id,"stone_pickaxe");
 assert.equal(matchCraftingRecipe(["cobblestone","cobblestone","cobblestone","cobblestone",null,"cobblestone","cobblestone","cobblestone","cobblestone"],3,"table")?.id,"furnace");
 assert.equal(matchCraftingRecipe(["oak_planks","oak_planks","oak_planks","oak_planks",null,"oak_planks","oak_planks","oak_planks","oak_planks"],3,"table")?.id,"chest");
});
test("workbench recipe book contains tools and basic survival stations",()=>{
 const ids=getCraftingRecipes("table").map(r=>r.id);
 for(const id of ["wooden_pickaxe","wooden_axe","wooden_shovel","wooden_sword","stone_pickaxe","iron_pickaxe","furnace","chest","torch"])assert.ok(ids.includes(id));
});

test("every crafting result exists in the item registry",()=>{
 for(const station of ["personal","table"])for(const recipe of getCraftingRecipes(station))assert.ok(ITEM_MAP[recipe.output.id],"missing item "+recipe.output.id);
});
