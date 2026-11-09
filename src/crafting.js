const personalRecipes=[
 {id:"planks",name:"Tablones de roble",pattern:[["oak_log"]],output:{id:"oak_planks",count:4}},
 {id:"sticks",name:"Palos",pattern:[["oak_planks"],["oak_planks"]],output:{id:"stick",count:4}},
 {id:"crafting_table",name:"Mesa de trabajo",pattern:[["oak_planks","oak_planks"],["oak_planks","oak_planks"]],output:{id:"crafting_table",count:1}}
];
const workbenchRecipes=[
 {id:"wooden_pickaxe",name:"Pico de madera",pattern:[["oak_planks","oak_planks","oak_planks"],[null,"stick",null],[null,"stick",null]],output:{id:"wooden_pickaxe",count:1}},
 {id:"wooden_axe",name:"Hacha de madera",pattern:[["oak_planks","oak_planks",null],["oak_planks","stick",null],[null,"stick",null]],output:{id:"wooden_axe",count:1}},
 {id:"wooden_shovel",name:"Pala de madera",pattern:[["oak_planks"],["stick"],["stick"]],output:{id:"wooden_shovel",count:1}},
 {id:"wooden_sword",name:"Espada de madera",pattern:[["oak_planks"],["oak_planks"],["stick"]],output:{id:"wooden_sword",count:1}},
 {id:"stone_pickaxe",name:"Pico de piedra",pattern:[["cobblestone","cobblestone","cobblestone"],[null,"stick",null],[null,"stick",null]],output:{id:"stone_pickaxe",count:1}},
 {id:"iron_pickaxe",name:"Pico de hierro",pattern:[["iron_ingot","iron_ingot","iron_ingot"],[null,"stick",null],[null,"stick",null]],output:{id:"iron_pickaxe",count:1}},
 {id:"furnace",name:"Horno",pattern:[["cobblestone","cobblestone","cobblestone"],["cobblestone",null,"cobblestone"],["cobblestone","cobblestone","cobblestone"]],output:{id:"furnace",count:1}},
 {id:"chest",name:"Cofre",pattern:[["oak_planks","oak_planks","oak_planks"],["oak_planks",null,"oak_planks"],["oak_planks","oak_planks","oak_planks"]],output:{id:"chest",count:1}},
 {id:"torch",name:"Antorchas",pattern:[["coal"],["stick"]],output:{id:"torch",count:4}}
];
function trimPattern(pattern){
 const cells=[];
 for(let y=0;y<pattern.length;y++)for(let x=0;x<pattern[y].length;x++)if(pattern[y][x])cells.push([y,x,pattern[y][x]]);
 if(!cells.length)return null;
 const minY=Math.min(...cells.map(c=>c[0])),maxY=Math.max(...cells.map(c=>c[0]));
 const minX=Math.min(...cells.map(c=>c[1])),maxX=Math.max(...cells.map(c=>c[1]));
 const rows=[];
 for(let y=minY;y<=maxY;y++){const row=[];for(let x=minX;x<=maxX;x++)row.push(pattern[y]?.[x]??null);rows.push(row);}
 return rows;
}
export function matchCraftingRecipe(grid,size,station="personal"){
 const recipes=station==="table"?workbenchRecipes:personalRecipes;
 if(!Array.isArray(grid)||grid.length!==size*size)return null;
 const rows=Array.from({length:size},(_,y)=>grid.slice(y*size,(y+1)*size));
 const input=trimPattern(rows);if(!input)return null;
 for(const recipe of recipes){
  const pattern=trimPattern(recipe.pattern);if(!pattern||pattern.length!==input.length||pattern[0].length!==input[0].length)continue;
  let matches=true;
  for(let y=0;y<input.length&&matches;y++)for(let x=0;x<input[y].length;x++)if((input[y][x]??null)!==(pattern[y][x]??null)){matches=false;break;}
  if(matches)return recipe;
 }
 return null;
}
export function getCraftingRecipes(station="personal"){return (station==="table"?workbenchRecipes:personalRecipes).map(recipe=>({...recipe,pattern:recipe.pattern.map(row=>[...row]),output:{...recipe.output}}));}
