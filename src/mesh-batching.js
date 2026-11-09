export function batchGreedyMeshes(blockMeshes,blockMap,atlasRects){
 const batches=new Map();
 for(const [id,data] of blockMeshes){
  const definition=blockMap[id];if(!definition)continue;
  const category=id==="leaves"?"cutout":id==="glass"?"glass":"opaque";
  let batch=batches.get(category);
  if(!batch){batch={positions:[],uvs:[],atlasRects:[],indices:[],quadCount:0,blockTypes:new Set()};batches.set(category,batch);}
  const vertexOffset=batch.positions.length/3;
  batch.positions.push(...data.positions);batch.uvs.push(...data.uvs);batch.blockTypes.add(id);batch.quadCount+=data.quadCount;
  for(const index of data.indices)batch.indices.push(index+vertexOffset);
  const faces=atlasRects.get(id);
  if(!faces)throw new Error("Missing texture atlas entry for "+id);
  for(const group of data.groups){
   const rect=faces[group.materialIndex];
   if(!rect)throw new Error("Missing face atlas rect for "+id+" face "+group.materialIndex);
   const vertexCount=group.count/6*4;
   for(let i=0;i<vertexCount;i++)batch.atlasRects.push(rect[0],rect[1],rect[2],rect[3]);
  }
 }
 for(const batch of batches.values())batch.blockTypes=[...batch.blockTypes];
 return batches;
}
