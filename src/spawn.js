export function findSafeSpawn(world,originX=0,originZ=0,maxRadius=80){
 const isSafe=(x,z)=>{
  if(!Number.isInteger(x)||!Number.isInteger(z))return null;
  const ground=world.highest(x,z),surface=world.get(x,ground,z);
  if(surface!=="grass"&&surface!=="sand")return null;
  if(world.get(x,ground+1,z)!==null||world.get(x,ground+2,z)!==null)return null;
  return {x,y:ground+2.12,z};
 };
 for(let radius=0;radius<=maxRadius;radius+=2){
  const candidates=[];
  if(radius===0)candidates.push([originX,originZ]);
  else{
   for(let offset=-radius;offset<=radius;offset+=2){
    candidates.push([originX+offset,originZ-radius]);
    candidates.push([originX+offset,originZ+radius]);
    if(offset!==-radius&&offset!==radius){
     candidates.push([originX-radius,originZ+offset]);
     candidates.push([originX+radius,originZ+offset]);
    }
   }
  }
  let sand=null;
  for(const [x,z] of candidates){
   const candidate=isSafe(x,z);if(!candidate)continue;
   if(world.get(x,candidate.y-2.12,z)==="grass")return candidate;
   sand??=candidate;
  }
  if(sand)return sand;
 }
 return {x:originX,y:world.highest(originX,originZ)+2.12,z:originZ};
}
