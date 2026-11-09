import {chunkAddress} from "./terrain.js";
const keyOf=(x,y,z)=>String(x)+","+String(y)+","+String(z),decodeKey=k=>k.split(",").map(Number);
const DIRS=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],HORIZ=[[1,0],[-1,0],[0,1],[0,-1]];
export class WaterSimulation{
 constructor(world,{tickInterval=.22,updateBudget=32,maxLevel=7,maxChunkRebuildsPerFrame=2}={}){this.world=world;this.tickInterval=tickInterval;this.updateBudget=updateBudget;this.maxLevel=maxLevel;this.maxChunkRebuildsPerFrame=maxChunkRebuildsPerFrame;this.pendingChunks=new Set();this.accumulator=0;this.sources=new Set(world.waterSources||[]);world.waterSources=this.sources;this.levels=new Map();world.waterStates=this.levels;this.active=new Set();for(const [k,id] of world.blocks){if(id!=="water")continue;const [x,y,z]=decodeKey(k),source=this.sources.has(k);this.levels.set(k,{level:source?0:1,falling:!source&&world.get(x,y+1,z)==="water",source});if(source)this.active.add(k);}}
 markChunks(x,z,set){for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){const a=chunkAddress(x+dx,z+dz);if(a)set.add(a.key);}}
 rebuildChunks(set){for(const k of set){const [ix,iz]=k.split(",").map(Number);this.world.rebuildChunk(ix,iz);}}
 addSource(x,y,z,{rebuild=true,activate=true}={}){x=Math.round(x);y=Math.round(y);z=Math.round(z);const k=keyOf(x,y,z),id=this.world.get(x,y,z);if(id!==null&&id!=="water")return false;if(!this.world.set(x,y,z,"water",false))return false;this.sources.add(k);this.world.waterSources.add(k);this.levels.set(k,{level:0,falling:false,source:true,settled:false});if(activate)this.active.add(k);if(rebuild){const set=new Set();this.markChunks(x,z,set);this.rebuildChunks(set);}return true;}
 restoreSources(entries=[]){const set=new Set();for(const e of entries){const k=Array.isArray(e)&&e.length===3?keyOf(...e.map(Number)):typeof e==="string"?e:null;if(!k)continue;const [x,y,z]=decodeKey(k);if(![x,y,z].every(Number.isFinite)||y<-5||y>32)continue;const id=this.world.get(x,y,z);if(id!==null&&id!=="water")continue;if(!this.world.set(x,y,z,"water",false))continue;this.sources.add(k);this.world.waterSources.add(k);this.levels.set(k,{level:0,falling:false,source:true,settled:false});this.active.add(k);this.markChunks(x,z,set);}this.rebuildChunks(set);return this;}
 exportSources(){return [...this.sources].map(decodeKey);}
 update(dt){
  if(!Number.isFinite(dt)||dt<=0){this.flushRebuilds(this.maxChunkRebuildsPerFrame);return 0;}
  this.accumulator=Math.min(this.accumulator+dt,this.tickInterval*3);
  let n=0;
  while(this.accumulator>=this.tickInterval){this.accumulator-=this.tickInterval;this.tick();n++;}
  this.flushRebuilds(this.maxChunkRebuildsPerFrame);
  return n;
 }
 queueRebuildChunks(set){
  for(const key of set)this.pendingChunks.add(key);
 }
 flushRebuilds(limit=2){
  let rebuilt=0;
  for(const key of this.pendingChunks){
   const [ix,iz]=key.split(",").map(Number);
   this.world.rebuildChunk(ix,iz);this.pendingChunks.delete(key);
   if(++rebuilt>=limit)break;
  }
  return rebuilt;
 }
 tick(){
  const work=[...this.active].slice(0,this.updateBudget),set=new Set();
  for(const k of work){
    this.active.delete(k);
    const [x,y,z]=decodeKey(k);
    if(this.world.get(x,y,z)!=="water"){this.levels.delete(k);continue;}
    let state=this.levels.get(k)||{level:1,falling:false,source:false,settled:false};
    const below=this.world.get(x,y-1,z);
    const supported=below==="water"||(below!==null&&this.world.isSolid(x,y-1,z));
    const canFall=below===null||(below!=="water"&&!this.world.isSolid(x,y-1,z));
    if(y>-5&&canFall){
      if(!state.falling){state={...state,falling:true,settled:false,level:1};this.levels.set(k,state);this.markChunks(x,z,set);}
      this.flow(x,y-1,z,{level:1,falling:true,source:false,settled:false},set);
      continue;
    }
    if(state.falling||state.settled!==supported){
      state={...state,falling:false,settled:supported,level:state.source?0:Math.max(1,state.level)};
      this.levels.set(k,state);this.markChunks(x,z,set);
    }
    const level=state.source?1:Math.max(1,state.level+1);
    if(level>this.maxLevel)continue;
    for(const [dx,dz] of HORIZ)this.flow(x+dx,y,z+dz,{level,falling:false,source:false,settled:supported},set);
  }
  this.queueRebuildChunks(set);return work.length;
 }
 flow(x,y,z,state,set){const id=this.world.get(x,y,z);if(id!==null&&id!=="water"&&this.world.isSolid(x,y,z))return false;const k=keyOf(x,y,z);if(id==="water"){const prev=this.levels.get(k);if(prev?.source)return false;const better=!prev||(state.falling&&!prev.falling)||(!state.falling&&!prev.falling&&state.level<prev.level);if(!better)return false;this.levels.set(k,state);this.active.add(k);this.markChunks(x,z,set);return true;}if(!this.world.set(x,y,z,"water",false))return false;this.levels.set(k,state);this.active.add(k);this.markChunks(x,z,set);return true;}
 onBlocksChanged(changes=[]){
 const set=new Set(),wake=new Set();let needsPrune=false,touchesWater=false;
 for(const [x,y,z,previous,next] of changes){
  if(![x,y,z].every(Number.isFinite))continue;
  const address=chunkAddress(x,z);if(address)set.add(address.key);
  const key=keyOf(x,y,z);
  if(previous==="water"&&next!=="water"){this.sources.delete(key);this.world.waterSources.delete(key);this.levels.delete(key);this.active.delete(key);needsPrune=true;touchesWater=true;}
  if(next!=="water"&&this.sources.has(key)){this.sources.delete(key);this.world.waterSources.delete(key);needsPrune=true;touchesWater=true;}
  for(const [dx,dy,dz] of DIRS){const nx=x+dx,ny=y+dy,nz=z+dz;if(this.world.get(nx,ny,nz)==="water"){wake.add(keyOf(nx,ny,nz));touchesWater=true;}}
 }
 if(touchesWater)for(const [x,,z] of changes)if(Number.isFinite(x)&&Number.isFinite(z))this.markChunks(x,z,set);
 if(needsPrune)this.prune(set);
 for(const key of wake)if(this.world.get(...decodeKey(key))==="water")this.active.add(key);
 this.rebuildChunks(set);
 }
 prune(set=new Set()){const queue=[],reachable=new Set(),previousActive=new Set(this.active);for(const k of [...this.sources]){const [x,y,z]=decodeKey(k);if(this.world.get(x,y,z)!=="water"){this.sources.delete(k);this.world.waterSources.delete(k);this.levels.delete(k);continue;}if(!reachable.has(k)){reachable.add(k);queue.push([x,y,z]);}}for(let i=0;i<queue.length;i++){const [x,y,z]=queue[i];for(const [dx,dy,dz] of DIRS){const nx=x+dx,ny=y+dy,nz=z+dz,k=keyOf(nx,ny,nz);if(reachable.has(k)||this.world.get(nx,ny,nz)!=="water")continue;reachable.add(k);queue.push([nx,ny,nz]);}}for(const [k] of [...this.levels]){if(this.world.get(...decodeKey(k))!=="water"){this.levels.delete(k);continue;}if(!reachable.has(k)){const [x,y,z]=decodeKey(k);this.world.set(x,y,z,null,false);this.levels.delete(k);this.markChunks(x,z,set);}}for(const k of reachable)if(!this.levels.has(k)){const [x,y,z]=decodeKey(k),source=this.sources.has(k);this.levels.set(k,{level:source?0:1,falling:!source&&this.world.get(x,y+1,z)==="water",source});}this.active=new Set([...previousActive].filter(k=>reachable.has(k)));this.world.waterStates=this.levels;}
}
