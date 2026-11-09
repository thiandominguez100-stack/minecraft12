export const BLOCKS = [
  {id:"grass",name:"Césped",group:"Naturaleza",color:0x6b9f43,hardness:.6,drop:"dirt",top:0x79b84b,side:0x78934c},
  {id:"dirt",name:"Tierra",group:"Naturaleza",color:0x8a6244,hardness:.5,drop:"dirt"},
  {id:"stone",name:"Piedra",group:"Naturaleza",color:0x85898c,hardness:1.5,drop:"cobblestone",tool:"pickaxe"},
  {id:"cobblestone",name:"Roca",group:"Construcción",color:0x696d70,hardness:2,drop:"cobblestone",tool:"pickaxe"},
  {id:"oak_log",name:"Tronco de roble",group:"Naturaleza",color:0x946b3d,hardness:2,drop:"oak_log",tool:"axe"},
  {id:"oak_planks",name:"Tablones de roble",group:"Construcción",color:0xb88a54,hardness:2,drop:"oak_planks",tool:"axe"},
  {id:"leaves",name:"Hojas",group:"Naturaleza",color:0x477c39,hardness:.2,drop:"leaves",transparent:true},
  {id:"sand",name:"Arena",group:"Naturaleza",color:0xd8c58b,hardness:.5,drop:"sand"},
  {id:"glass",name:"Cristal",group:"Construcción",color:0xa8d9df,hardness:.3,drop:null,transparent:true},
  {id:"bricks",name:"Ladrillos",group:"Construcción",color:0x9c594b,hardness:2,drop:"bricks",tool:"pickaxe"},
  {id:"coal_ore",name:"Mineral de carbón",group:"Minerales",color:0x62666a,hardness:3,drop:"coal",tool:"pickaxe",accent:0x242629},
  {id:"iron_ore",name:"Mineral de hierro",group:"Minerales",color:0x777b7e,hardness:3,drop:"raw_iron",tool:"pickaxe",accent:0xb68b70},
  {id:"gold_ore",name:"Mineral de oro",group:"Minerales",color:0x777b7e,hardness:3,drop:"raw_gold",tool:"pickaxe",accent:0xe9c544},
  {id:"diamond_ore",name:"Mineral de diamante",group:"Minerales",color:0x777b7e,hardness:3,drop:"diamond",tool:"pickaxe",accent:0x39d5cb},
  {id:"bedrock",name:"Roca madre",group:"Naturaleza",color:0x34383b,hardness:-1,drop:null},
  {id:"water",name:"Agua",group:"Naturaleza",color:0x367fbd,hardness:-1,drop:null,transparent:true,solid:false},
  {id:"torch",name:"Antorcha",group:"Decoración",color:0xf5b84b,hardness:0,drop:"torch",solid:false},
  {id:"crafting_table",name:"Mesa de trabajo",group:"Decoración",color:0xa47745,hardness:2.5,drop:"crafting_table",tool:"axe"},
  {id:"furnace",name:"Horno",group:"Decoración",color:0x777b7e,hardness:3.5,drop:"furnace",tool:"pickaxe"},
  {id:"chest",name:"Cofre",group:"Decoración",color:0xa8793e,hardness:2.5,drop:"chest",tool:"axe"},
  {id:"snow",name:"Nieve",group:"Naturaleza",color:0xe5edf0,hardness:.2,drop:"snow"},
  {id:"clay",name:"Arcilla",group:"Naturaleza",color:0x9cabb5,hardness:.6,drop:"clay"},
  {id:"moss",name:"Musgo",group:"Naturaleza",color:0x557b46,hardness:.2,drop:"moss"}
];

export const ITEMS = [
  ...BLOCKS.map(b=>({id:b.id,name:b.name,kind:"block",group:b.group,color:b.color,stack:64})),
  {id:"stick",name:"Palo",kind:"material",group:"Materiales",color:0xb58a57,stack:64},
  {id:"coal",name:"Carbón",kind:"material",group:"Materiales",color:0x292c30,stack:64},
  {id:"raw_iron",name:"Hierro en bruto",kind:"material",group:"Materiales",color:0xb58d79,stack:64},
  {id:"raw_gold",name:"Oro en bruto",kind:"material",group:"Materiales",color:0xe5be47,stack:64},
  {id:"iron_ingot",name:"Lingote de hierro",kind:"material",group:"Materiales",color:0xd0c9bd,stack:64},
  {id:"gold_ingot",name:"Lingote de oro",kind:"material",group:"Materiales",color:0xf2cf45,stack:64},
  {id:"diamond",name:"Diamante",kind:"material",group:"Materiales",color:0x4de0d0,stack:64},
  {id:"bread",name:"Pan",kind:"food",group:"Comida",color:0xc99b53,stack:64,food:5},
  {id:"apple",name:"Manzana",kind:"food",group:"Comida",color:0xc9483e,stack:64,food:4},
  {id:"wooden_pickaxe",name:"Pico de madera",kind:"tool",group:"Herramientas",color:0xb68a51,stack:1,tool:"pickaxe",tier:1,durability:60},
  {id:"stone_pickaxe",name:"Pico de piedra",kind:"tool",group:"Herramientas",color:0x777b7e,stack:1,tool:"pickaxe",tier:2,durability:132},
  {id:"iron_pickaxe",name:"Pico de hierro",kind:"tool",group:"Herramientas",color:0xc3c9c9,stack:1,tool:"pickaxe",tier:3,durability:251},
  {id:"wooden_axe",name:"Hacha de madera",kind:"tool",group:"Herramientas",color:0xb68a51,stack:1,tool:"axe",tier:1,durability:60},
  {id:"wooden_shovel",name:"Pala de madera",kind:"tool",group:"Herramientas",color:0xb68a51,stack:1,tool:"shovel",tier:1,durability:60},
  {id:"wooden_sword",name:"Espada de madera",kind:"tool",group:"Herramientas",color:0xb68a51,stack:1,tool:"sword",tier:1,durability:60},
  {id:"raw_mutton",name:"Carne cruda",kind:"food",group:"Comida",color:0xb85c55,stack:64,food:2},
  {id:"raw_beef",name:"Carne cruda",kind:"food",group:"Comida",color:0x9e4544,stack:64,food:2},
  {id:"raw_chicken",name:"Pollo crudo",kind:"food",group:"Comida",color:0xd99c79,stack:64,food:2},
  {id:"wool",name:"Lana",kind:"material",group:"Materiales",color:0xe5e1d5,stack:64}
];

export const RECIPES = [
  {id:"planks",name:"Tablones de roble ×4",in:{oak_log:1},out:{oak_planks:4},station:"inventory"},
  {id:"sticks",name:"Palos ×4",in:{oak_planks:2},out:{stick:4},station:"inventory"},
  {id:"crafting_table",name:"Mesa de trabajo",in:{oak_planks:4},out:{crafting_table:1},station:"inventory"},
  {id:"wooden_pickaxe",name:"Pico de madera",in:{oak_planks:3,stick:2},out:{wooden_pickaxe:1},station:"table"},
  {id:"wooden_axe",name:"Hacha de madera",in:{oak_planks:3,stick:2},out:{wooden_axe:1},station:"table"},
  {id:"wooden_shovel",name:"Pala de madera",in:{oak_planks:1,stick:2},out:{wooden_shovel:1},station:"table"},
  {id:"wooden_sword",name:"Espada de madera",in:{oak_planks:2,stick:1},out:{wooden_sword:1},station:"table"},
  {id:"stone_pickaxe",name:"Pico de piedra",in:{cobblestone:3,stick:2},out:{stone_pickaxe:1},station:"table"},
  {id:"furnace",name:"Horno",in:{cobblestone:8},out:{furnace:1},station:"table"},
  {id:"chest",name:"Cofre",in:{oak_planks:8},out:{chest:1},station:"table"},
  {id:"torch",name:"Antorchas ×4",in:{coal:1,stick:1},out:{torch:4},station:"inventory"}
];

export const ITEM_MAP = Object.fromEntries(ITEMS.map(i=>[i.id,i]));
export const BLOCK_MAP = Object.fromEntries(BLOCKS.map(b=>[b.id,b]));
export function resolveBlockDrop(blockId){
 const def=BLOCK_MAP[blockId];
 if(!def||def.hardness<0)return null;
 return def.drop??blockId;
}
export const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
