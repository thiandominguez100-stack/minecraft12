import * as THREE from "three";
import {BLOCK_MAP} from "./data.js";
import {greedyMeshChunk} from "./greedy-meshing.js";
import {getBlockAtlasResources} from "./block-atlas.js";
import {batchGreedyMeshes} from "./mesh-batching.js";
import {CHUNK_SIZE,chunkAddress,chunksInRadius,isInsideWorld} from "./terrain.js";
import {createGrassBladeBuffers,createGrassBladeGeometry,createGrassBladeMaterial,windStrengthForWeather} from "./grass-wind.js";
const keyOf=(x,y,z)=>String(x)+","+String(y)+","+String(z),decodeKey=k=>k.split(",").map(Number);
const BASE_MIN_Y=-3,BASE_MAX_Y=0;
export class VoxelWorld{
 constructor(scene,seed=20261109,options={}){
  this.scene=scene;this.seed=seed;this.blocks=new Map();this.changes=new Map();this.changesByChunk=new Map();this.waterSources=new Set();this.waterStates=new Map();
  this.group=new THREE.Group();this.group.name="InfiniteGrassWorld";scene.add(this.group);
  this.chunkGroups=new Map();this.chunkBlocks=new Map();this.chunkSize=CHUNK_SIZE;this.chunkCount=Infinity;this.renderDistanceChunks=5.8;
  this.renderCenter={x:0,z:0,ix:NaN,iz:NaN};this.desiredChunks=new Set();this.pendingChunks=[];
  this.bounds={minX:-Infinity,maxX:Infinity,minZ:-Infinity,maxZ:Infinity,width:Infinity,depth:Infinity,infinite:true};
  const atlas=getBlockAtlasResources();this.blockAtlasTexture=atlas.texture;this.blockAtlasRects=atlas.rects;this.blockMaterials=atlas.materials;
  this.windUniforms={time:{value:0},strength:{value:windStrengthForWeather("clear",0)}};
  this.grassBladeGeometry=createGrassBladeGeometry(THREE);this.grassBladeMaterial=createGrassBladeMaterial(THREE,this.windUniforms);
  if(!options.defer)this.generate();
 }
 putBlock(x,y,z,id){if(!isInsideWorld(x,z)||!Number.isInteger(y)||y<-64||y>256)return;this.set(x,y,z,id,false);}
 generateColumn(x,z){for(let y=BASE_MIN_Y;y<=BASE_MAX_Y;y++)this.putBlock(x,y,z,"grass");}
 generateTerrain(){this.updateRenderDistance(0,0,4.8);for(const k of this.desiredChunks){const [x,z]=k.split(",").map(Number);this.generateChunkData(x,z);}}
 generate(){this.updateRenderDistance(0,0,4.8);this.updateStreaming(3);}
 async generateAsync(onProgress=()=>{}){
  this.clearChunks();this.renderCenter={x:0,z:0,ix:NaN,iz:NaN};this.updateRenderDistance(0,0,5.8);
  const total=this.pendingChunks.length;let built=0;onProgress(2,"Preparando una pradera infinita · chunks de 16 × 16");
  while(this.pendingChunks.length){built+=this.updateStreaming(3);onProgress(Math.min(99,Math.round(4+built/Math.max(1,total)*95)),"Extendiendo el césped · "+built+" / "+total+" chunks");await new Promise(resolve=>setTimeout(resolve,0));}
  onProgress(100,"Pradera lista · terreno continuo en todas las direcciones");
 }
 clearChunks(){for(const g of this.chunkGroups.values())this.disposeChunkGroup(g);this.chunkGroups.clear();this.chunkBlocks.clear();this.blocks.clear();this.pendingChunks=[];this.desiredChunks.clear();this.group.clear();}
 dispose(){this.clearChunks();this.scene.remove(this.group);this.grassBladeGeometry.dispose();this.grassBladeMaterial.dispose();}
 isBaseGrass(x,y,z){return y>=BASE_MIN_Y&&y<=BASE_MAX_Y;}
 get(x,y,z){x=Math.round(x);y=Math.round(y);z=Math.round(z);if(!isInsideWorld(x,z))return null;const k=keyOf(x,y,z);if(this.changes.has(k))return this.changes.get(k)||null;if(this.blocks.has(k))return this.blocks.get(k);return this.isBaseGrass(x,y,z)?"grass":null;}
 set(x,y,z,id,rebuildNow=true){
  x=Math.round(x);y=Math.round(y);z=Math.round(z);if(!isInsideWorld(x,z)||y<-64||y>256)return false;if(id&&!BLOCK_MAP[id])return false;
  const k=keyOf(x,y,z),a=chunkAddress(x,z);if(!a)return false;const base=this.isBaseGrass(x,y,z)?"grass":null;
  if(id===base)this.changes.delete(k);else this.changes.set(k,id||null);
  let byChunk=this.changesByChunk.get(a.key);if(!byChunk&&id!==base){byChunk=new Map();this.changesByChunk.set(a.key,byChunk);}
  if(byChunk){if(id===base)byChunk.delete(k);else byChunk.set(k,id||null);if(!byChunk.size)this.changesByChunk.delete(a.key);}
  if(id)this.blocks.set(k,id);else this.blocks.delete(k);
  const chunk=this.chunkBlocks.get(a.key);
  if(chunk){if(id)chunk.set(k,{x,y,z,id});else chunk.delete(k);if(rebuildNow)this.rebuildChunksAround(x,z);}
  else if(rebuildNow&&this.desiredChunks.has(a.key))this.queueChunk(a.key);
  return true;
 }
 isSolid(x,y,z){const id=this.get(x,y,z);return !!id&&BLOCK_MAP[id]?.solid!==false&&id!=="water"&&id!=="leaves"&&id!=="torch";}
 getSubmersion(){return 0;} isEyeUnderwater(){return false;}
 highest(x,z){for(let y=256;y>=-64;y--)if(this.isSolid(x,y,z))return y;return -64;}
 collides(pos,r=.29,height=1.8){
  const e=1e-5,feet=pos.y-1.62,head=feet+height,minX=Math.floor(pos.x-r+.5+e),maxX=Math.floor(pos.x+r+.5-e),minY=Math.floor(feet+.5+e),maxY=Math.floor(head+.5-e),minZ=Math.floor(pos.z-r+.5+e),maxZ=Math.floor(pos.z+r+.5-e);
  for(let x=minX;x<=maxX;x++)for(let y=minY;y<=maxY;y++)for(let z=minZ;z<=maxZ;z++)if(this.isSolid(x,y,z))return true;return false;
 }
 findGroundSurface(pos,r=.29,maxGap=.12,maxPenetration=.12){
  const feet=pos.y-1.62,samples=[[0,0,true],[-r*.8,-r*.8,false],[r*.8,-r*.8,false],[-r*.8,r*.8,false],[r*.8,r*.8,false]],counts=new Map(),first=Math.floor(feet+.5);
  for(const [dx,dz,center] of samples){const x=Math.floor(pos.x+dx+.5),z=Math.floor(pos.z+dz+.5);for(let y=first;y>=first-5;y--){if(!this.isSolid(x,y,z))continue;const top=y+.5,gap=feet-top;if(gap>=-maxPenetration&&gap<=maxGap){const k=String(top),v=counts.get(k)||{top,count:0,center:false};v.count++;v.center||=center;counts.set(k,v);break;}}}
  const best=[...counts.values()].sort((a,b)=>b.count-a.count||b.top-a.top)[0];return best&&(best.count>=3||(best.center&&best.count>=2))?best.top:null;
 }
 generateChunkData(ix,iz){
  const ck=ix+","+iz,old=this.chunkBlocks.get(ck);if(old)return old;
  const entries=new Map(),sx=ix*CHUNK_SIZE,sz=iz*CHUNK_SIZE;
  for(let x=sx;x<sx+CHUNK_SIZE;x++)for(let z=sz;z<sz+CHUNK_SIZE;z++)for(let y=BASE_MIN_Y;y<=BASE_MAX_Y;y++){
   const k=keyOf(x,y,z),id=this.changes.has(k)?this.changes.get(k):"grass";if(id){entries.set(k,{x,y,z,id});this.blocks.set(k,id);}
  }
  for(const [k,id] of this.changesByChunk.get(ck)||[]){const [x,y,z]=decodeKey(k);if(y>=BASE_MIN_Y&&y<=BASE_MAX_Y)continue;if(id){entries.set(k,{x,y,z,id});this.blocks.set(k,id);}}
  this.chunkBlocks.set(ck,entries);return entries;
 }
 disposeChunkGroup(g){if(!g)return;g.traverse(o=>{if(o.isMesh&&o.userData?.chunkGeometry)o.geometry?.dispose();});this.group.remove(g);g.clear();}
 rebuildChunksAround(x,z){
  const a=chunkAddress(x,z);if(!a)return;const affected=new Set([a.key]),lx=((x%16)+16)%16,lz=((z%16)+16)%16;
  if(lx===0)affected.add((a.ix-1)+","+a.iz);if(lx===15)affected.add((a.ix+1)+","+a.iz);if(lz===0)affected.add(a.ix+","+(a.iz-1));if(lz===15)affected.add(a.ix+","+(a.iz+1));
  for(const k of affected)if(this.chunkGroups.has(k)){const [ix,iz]=k.split(",").map(Number);this.rebuildChunk(ix,iz);}
 }
 rebuildChunk(ix,iz){
  const ck=ix+","+iz,old=this.chunkGroups.get(ck);if(old)this.disposeChunkGroup(old);
  const g=new THREE.Group();g.name="Grass Chunk "+ck;g.userData={chunkX:ix,chunkZ:iz,blockSize:16};
  const entries=this.chunkBlocks.get(ck)||this.generateChunkData(ix,iz),voxelMeshes=greedyMeshChunk(entries.values(),(x,y,z)=>this.get(x,y,z),BLOCK_MAP),batches=batchGreedyMeshes(voxelMeshes,BLOCK_MAP,this.blockAtlasRects);
  for(const [category,d] of batches){if(!d.positions.length)continue;const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.Float32BufferAttribute(d.positions,3));geo.setAttribute("uv",new THREE.Float32BufferAttribute(d.uvs,2));geo.setAttribute("atlasRect",new THREE.Float32BufferAttribute(d.atlasRects,4));geo.setIndex(d.indices);geo.computeVertexNormals();geo.computeBoundingSphere();const mesh=new THREE.Mesh(geo,this.blockMaterials[category]);mesh.userData={blockId:"voxel-batch",greedyMesh:true,chunkGeometry:true,meshCategory:category,quadCount:d.quadCount,blockTypes:d.blockTypes};g.add(mesh);}
  const bladeBuffers=createGrassBladeBuffers(this.seed,entries.values());
  if(bladeBuffers.count){
   const mesh=new THREE.InstancedMesh(this.grassBladeGeometry,this.grassBladeMaterial,bladeBuffers.count);
   mesh.instanceMatrix.array.set(bladeBuffers.matrices);mesh.instanceMatrix.needsUpdate=true;
   mesh.instanceColor=new THREE.InstancedBufferAttribute(bladeBuffers.colors,3);mesh.instanceColor.needsUpdate=true;
   mesh.frustumCulled=false;mesh.raycast=()=>{};
   mesh.userData={grassWind:true,bladeCount:bladeBuffers.count,bladeDensity:bladeBuffers.count/Math.max(1,bladeBuffers.tileCount)};
   g.add(mesh);
  }
  this.chunkGroupVisibility(g,ix,iz);this.chunkGroups.set(ck,g);this.group.add(g);return g;
 }
 chunkGroupVisibility(g,ix,iz){const cx=ix*16+8,cz=iz*16+8,dx=cx-this.renderCenter.x,dz=cz-this.renderCenter.z,r=(this.renderDistanceChunks+.8)*16;g.visible=dx*dx+dz*dz<=r*r;}
 queueChunk(k){if(this.desiredChunks.has(k)&&!this.chunkGroups.has(k)&&!this.pendingChunks.includes(k))this.pendingChunks.push(k);}
 updateRenderDistance(x,z,radius=this.renderDistanceChunks){
  if(!Number.isFinite(x)||!Number.isFinite(z))return false;const ix=Math.floor(x/16),iz=Math.floor(z/16);
  if(ix===this.renderCenter.ix&&iz===this.renderCenter.iz&&radius===this.renderDistanceChunks)return false;
  this.renderCenter={x,z,ix,iz};this.renderDistanceChunks=Math.max(2,Number(radius)||5);
  const chunks=chunksInRadius(x,z,this.renderDistanceChunks+.65),desired=new Set(chunks.map(c=>c.key));
  for(const [k,g] of [...this.chunkGroups])if(!desired.has(k)){this.disposeChunkGroup(g);this.chunkGroups.delete(k);const old=this.chunkBlocks.get(k);if(old)for(const bk of old.keys())this.blocks.delete(bk);this.chunkBlocks.delete(k);}
  this.desiredChunks=desired;this.pendingChunks=chunks.map(c=>c.key).filter(k=>!this.chunkGroups.has(k));return true;
 }
 updateStreaming(maxChunks=3){let built=0;while(this.pendingChunks.length&&built<maxChunks){const k=this.pendingChunks.shift();if(!this.desiredChunks.has(k)||this.chunkGroups.has(k))continue;const [ix,iz]=k.split(",").map(Number);this.generateChunkData(ix,iz);this.rebuildChunk(ix,iz);built++;}return built;}
 getNearbyChunkGroups(x,z,range=1){const ix=Math.floor(x/16),iz=Math.floor(z/16),out=[];for(let dz=-range;dz<=range;dz++)for(let dx=-range;dx<=range;dx++){const g=this.chunkGroups.get((ix+dx)+","+(iz+dz));if(g)out.push(g);}return out;}
 resolveHit(hit){if(!hit?.object||!hit.object.userData?.greedyMesh||!hit.point||!hit.face?.normal)return null;const normal=hit.face.normal.clone().transformDirection(hit.object.matrixWorld),point=hit.point.clone().addScaledVector(normal,-.01),x=Math.floor(point.x+.5),y=Math.floor(point.y+.5),z=Math.floor(point.z+.5),id=this.get(x,y,z);return id?{x,y,z,id}:null;}
 updateWind(time=0,weather="clear"){if(!Number.isFinite(time))return;this.windUniforms.time.value=time;this.windUniforms.strength.value=windStrengthForWeather(weather,time);}
 updateWaterAnimation(){}
 getWaterSummary(){return {cells:0,chunks:0,meshes:0,topFaces:0};}
 rebuild(){for(const [k,g] of [...this.chunkGroups]){this.disposeChunkGroup(g);this.chunkGroups.delete(k);}this.chunkBlocks.clear();this.blocks.clear();for(const k of this.desiredChunks){const [ix,iz]=k.split(",").map(Number);this.generateChunkData(ix,iz);this.rebuildChunk(ix,iz);}}
 importChanges(entries=[]){for(const [k,id] of entries||[]){const [x,y,z]=decodeKey(k);if(![x,y,z].every(Number.isFinite)||y<-64||y>256)continue;this.set(x,y,z,id,false);}for(const k of this.desiredChunks)if(this.chunkGroups.has(k)){const [ix,iz]=k.split(",").map(Number);this.rebuildChunk(ix,iz);}}
 exportChanges(){return [...this.changes.entries()];}
 getChunkSummary(){return {count:this.chunkGroups.size,size:16,infinite:true,chunkCount:Infinity,blockCount:this.blocks.size,bounds:this.bounds};}
}
