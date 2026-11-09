const FACE_DEFS=[
 {index:0,axis:0,sign:1,neighbor:[1,0,0],u:"z",v:"y"},
 {index:1,axis:0,sign:-1,neighbor:[-1,0,0],u:"z",v:"y"},
 {index:2,axis:1,sign:1,neighbor:[0,1,0],u:"x",v:"z"},
 {index:3,axis:1,sign:-1,neighbor:[0,-1,0],u:"x",v:"z"},
 {index:4,axis:2,sign:1,neighbor:[0,0,1],u:"x",v:"y"},
 {index:5,axis:2,sign:-1,neighbor:[0,0,-1],u:"x",v:"y"}
];
const cellKey=(u,v)=>u+","+v;
function isOccluded(currentId,neighborId,blockMap){
 if(!neighborId)return false;
 if(currentId===neighborId)return true;
 const neighbor=blockMap[neighborId];
 return !!neighbor&&neighbor.solid!==false&&!neighbor.transparent;
}
function makeQuad(face,plane,u,v,width,height){
 const positions=[],uvs=[];
 const push=(xyz,tex)=>{positions.push(...xyz);uvs.push(...tex);};
 if(face===0||face===1){
  const x=plane+(face===0?.5:-.5),y0=v-.5,y1=v+height-.5,z0=u-.5,z1=u+width-.5;
  if(face===0){push([x,y0,z0],[0,0]);push([x,y1,z0],[0,height]);push([x,y1,z1],[width,height]);push([x,y0,z1],[width,0]);}
  else{push([x,y0,z1],[0,0]);push([x,y1,z1],[0,height]);push([x,y1,z0],[width,height]);push([x,y0,z0],[width,0]);}
 }else if(face===2||face===3){
  const y=plane+(face===2?.5:-.5),x0=u-.5,x1=u+width-.5,z0=v-.5,z1=v+height-.5;
  if(face===2){push([x0,y,z0],[0,0]);push([x0,y,z1],[0,height]);push([x1,y,z1],[width,height]);push([x1,y,z0],[width,0]);}
  else{push([x0,y,z1],[0,0]);push([x0,y,z0],[0,height]);push([x1,y,z0],[width,height]);push([x1,y,z1],[width,0]);}
 }else{
  const z=plane+(face===4?.5:-.5),x0=u-.5,x1=u+width-.5,y0=v-.5,y1=v+height-.5;
  if(face===4){push([x0,y0,z],[0,0]);push([x1,y0,z],[width,0]);push([x1,y1,z],[width,height]);push([x0,y1,z],[0,height]);}
  else{push([x1,y0,z],[0,0]);push([x0,y0,z],[width,0]);push([x0,y1,z],[width,height]);push([x1,y1,z],[0,height]);}
 }
 return {positions,uvs};
}
export function greedyMeshChunk(entries,getBlock,blockMap){
 const masks=new Map();
 for(const block of entries){
  const {x,y,z,id}=block;
  if(!id||id==="water"||!blockMap[id])continue;
  for(const face of FACE_DEFS){
   const nx=x+face.neighbor[0],ny=y+face.neighbor[1],nz=z+face.neighbor[2];
   const neighborId=getBlock(nx,ny,nz);
   if(isOccluded(id,neighborId,blockMap))continue;
   const plane=face.axis===0?x:face.axis===1?y:z;
   const u=block[face.u],v=block[face.v],maskKey=id+"|"+face.index+"|"+plane;
   let mask=masks.get(maskKey);
   if(!mask){mask={id,face:face.index,plane,cells:new Set()};masks.set(maskKey,mask);}
   mask.cells.add(cellKey(u,v));
  }
 }
 const output=new Map();
 for(const mask of masks.values()){
  const cells=mask.cells,ordered=[...cells].map(key=>key.split(",").map(Number)).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);
  let target=output.get(mask.id);
  if(!target){target={faces:Array.from({length:6},()=>[]),quadCount:0,blockId:mask.id};output.set(mask.id,target);}
  const quads=target.faces[mask.face];
  for(const [u,v] of ordered){
   if(!cells.has(cellKey(u,v)))continue;
   let width=1;while(cells.has(cellKey(u+width,v)))width++;
   let height=1;
   outer:while(true){for(let dx=0;dx<width;dx++)if(!cells.has(cellKey(u+dx,v+height)))break outer;height++;}
   for(let dy=0;dy<height;dy++)for(let dx=0;dx<width;dx++)cells.delete(cellKey(u+dx,v+dy));
   quads.push(makeQuad(mask.face,mask.plane,u,v,width,height));target.quadCount++;
  }
 }
 for(const target of output.values()){
  target.positions=[];target.uvs=[];target.indices=[];target.groups=[];
  let vertexOffset=0;
  for(let face=0;face<6;face++){
   const start=target.indices.length;
   for(const quad of target.faces[face]){
    target.positions.push(...quad.positions);target.uvs.push(...quad.uvs);
    target.indices.push(vertexOffset,vertexOffset+1,vertexOffset+2,vertexOffset,vertexOffset+2,vertexOffset+3);
    vertexOffset+=4;
   }
   const count=target.indices.length-start;
   if(count)target.groups.push({start,count,materialIndex:face});
  }
  delete target.faces;
 }
 return output;
}
