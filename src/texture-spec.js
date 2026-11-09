export const BLOCK_TEXTURE_SIZE=64;
export const BLOCK_TEXTURE_PROFILES=Object.freeze({
 grass:"green top, layered turf edge and exposed roots",dirt:"crumbled soil with pebbles and root fibres",
 stone:"fractured rock and mineral grain",cobblestone:"bevelled stone pieces and mortar",
 oak_log:"bark grain and growth rings",oak_planks:"wooden boards and knots",leaves:"alpha-cut foliage clusters",
 sand:"wind ripples and sand grains",glass:"translucent glass and edge glints",bricks:"offset clay bricks and mortar",
 coal_ore:"coal seams",iron_ore:"iron veins",gold_ore:"gold clusters",diamond_ore:"turquoise crystal seams",
 bedrock:"fractured dark foundation",water:"blue water tile",torch:"wood shaft and flame",
 crafting_table:"wood workbench grid",furnace:"stone casing and furnace mouth",chest:"wood and brass bands",
 snow:"packed snow and sparkle",clay:"mottled clay",moss:"organic moss patches"
});

export function blockMaterialSettings(blockId){
  if(blockId==="leaves")return {transparent:false,opacity:1,depthWrite:true,alphaTest:.42};
  if(blockId==="glass")return {transparent:true,opacity:.68,depthWrite:false,alphaTest:0};
  if(blockId==="water")return {transparent:true,opacity:.78,depthWrite:false,alphaTest:0};
  return {transparent:false,opacity:1,depthWrite:true,alphaTest:0};
}
