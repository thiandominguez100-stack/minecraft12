import {chunkAddress} from "./terrain.js";

const keyOf=(x,y,z)=>String(x)+","+String(y)+","+String(z);
const decodeKey=key=>key.split(",").map(Number);
const DIRECTIONS=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
const HORIZONTAL=[[1,0],[-1,0],[0,1],[0,-1]];

export class WaterSimulation{
  constructor(world,{tickInterval=.24,updateBudget=64,maxLevel=7}={}){
    this.world=world;
    this.tickInterval=tickInterval;
    this.updateBudget=updateBudget;
    this.maxLevel=maxLevel;
    this.accumulator=0;
    this.sources=new Set(world.waterSources||[]);
    this.world.waterSources=this.sources;
    this.levels=new Map();
    this.world.waterStates=this.levels;
    this.active=new Set();

    for(const [key,id] of world.blocks){
      if(id!=="water")continue;
      const [x,y,z]=decodeKey(key);
      const source=this.sources.has(key);
      const falling=!source&&world.get(x,y+1,z)==="water";
      this.levels.set(key,{level:1,falling,source});
      if(source)this.active.add(key);
    }
    for(const key of this.sources){
      if(world.get(...decodeKey(key))==="water"){
        this.levels.set(key,{level:0,falling:false,source:true});
        this.active.add(key);
      }
    }
  }

  markChunkNeighborhood(x,z,rebuild){
    for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
      const address=chunkAddress(x+dx,z+dz);
      if(address)rebuild.add(address.key);
    }
  }

  rebuildChunks(keys){
    for(const key of keys){
      const [ix,iz]=key.split(",").map(Number);
      this.world.rebuildChunk(ix,iz);
    }
  }

  addSource(x,y,z,{rebuild=true,activate=true}={}){
    x=Math.round(x);y=Math.round(y);z=Math.round(z);
    const key=keyOf(x,y,z);
    if(!this.world.set(x,y,z,"water",false))return false;
    this.sources.add(key);
    this.world.waterSources.add(key);
    this.levels.set(key,{level:0,falling:false,source:true});
    if(activate)this.active.add(key);
    if(rebuild){
      const chunks=new Set();
      this.markChunkNeighborhood(x,z,chunks);
      this.rebuildChunks(chunks);
    }
    return true;
  }

  restoreSources(entries=[]){
    const rebuild=new Set();
    for(const entry of entries){
      let key;
      if(Array.isArray(entry)&&entry.length===3)key=keyOf(...entry.map(Number));
      else if(typeof entry==="string")key=entry;
      else continue;
      const [x,y,z]=decodeKey(key);
      if(![x,y,z].every(Number.isFinite)||y<-5||y>32)continue;
      if(!this.world.set(x,y,z,"water",false))continue;
      this.sources.add(key);
      this.world.waterSources.add(key);
      this.levels.set(key,{level:0,falling:false,source:true});
      this.active.add(key);
      this.markChunkNeighborhood(x,z,rebuild);
    }
    this.rebuildChunks(rebuild);
    return this;
  }

  exportSources(){
    return [...this.sources].map(decodeKey);
  }

  update(dt){
    if(!Number.isFinite(dt)||dt<=0)return 0;
    this.accumulator=Math.min(this.accumulator+dt,this.tickInterval*3);
    let ticks=0;
    while(this.accumulator>=this.tickInterval){
      this.accumulator-=this.tickInterval;
      this.tick();
      ticks++;
    }
    return ticks;
  }

  tick(){
    const work=[...this.active].slice(0,this.updateBudget);
    const rebuild=new Set();
    for(const key of work){
      this.active.delete(key);
      const [x,y,z]=decodeKey(key);
      if(this.world.get(x,y,z)!=="water"){
        this.levels.delete(key);
        continue;
      }
      const state=this.levels.get(key)||{level:1,falling:false,source:false};
      const belowId=this.world.get(x,y-1,z);
      const belowCanBeFilled=belowId===null||(belowId!=="water"&&!this.world.isSolid(x,y-1,z));
      if(y>-5&&belowCanBeFilled){
        this.placeFlow(x,y-1,z,{level:1,falling:true,source:false},rebuild);
        continue;
      }

      const nextLevel=state.source?1:(state.falling?1:state.level+1);
      if(nextLevel>this.maxLevel)continue;
      for(const [dx,dz] of HORIZONTAL){
        this.placeFlow(x+dx,y,z+dz,{level:nextLevel,falling:false,source:false},rebuild);
      }
    }
    this.rebuildChunks(rebuild);
    return work.length;
  }

  placeFlow(x,y,z,state,rebuild){
    const id=this.world.get(x,y,z);
    if(id!==null&&id!=="water"&&this.world.isSolid(x,y,z))return false;
    const key=keyOf(x,y,z);
    if(id==="water"){
      const previous=this.levels.get(key);
      if(previous?.source)return false;
      const better=!previous||(state.falling&&!previous.falling)||(!state.falling&&!previous.falling&&state.level<previous.level);
      if(!better)return false;
      this.levels.set(key,state);
      this.active.add(key);
      this.markChunkNeighborhood(x,z,rebuild);
      return true;
    }
    if(!this.world.set(x,y,z,"water",false))return false;
    this.levels.set(key,state);
    this.active.add(key);
    this.markChunkNeighborhood(x,z,rebuild);
    return true;
  }

  onBlocksChanged(changes=[]){
    const rebuild=new Set();
    for(const change of changes){
      const [x,y,z,previousId,nextId]=change;
      if(![x,y,z].every(Number.isFinite))continue;
      this.markChunkNeighborhood(x,z,rebuild);
      const key=keyOf(x,y,z);
      if(previousId==="water"&&nextId!=="water"){
        this.sources.delete(key);
        this.world.waterSources.delete(key);
        this.levels.delete(key);
        this.active.delete(key);
      }
      if(nextId!=="water"&&this.sources.has(key)){
        this.sources.delete(key);
        this.world.waterSources.delete(key);
      }
    }

    this.pruneDisconnected(rebuild);
    for(const key of this.active){
      const [x,y,z]=decodeKey(key);
      for(const [dx,dy,dz] of DIRECTIONS){
        const nx=x+dx,ny=y+dy,nz=z+dz;
        if(this.world.get(nx,ny,nz)==="water")this.active.add(keyOf(nx,ny,nz));
      }
    }
    this.rebuildChunks(rebuild);
  }

  pruneDisconnected(rebuild=new Set()){
    const queue=[],reachable=new Set();
    for(const key of [...this.sources]){
      const [x,y,z]=decodeKey(key);
      if(this.world.get(x,y,z)!=="water"){
        this.sources.delete(key);
        this.world.waterSources.delete(key);
        this.levels.delete(key);
        continue;
      }
      if(!reachable.has(key)){reachable.add(key);queue.push([x,y,z]);}
    }

    for(let head=0;head<queue.length;head++){
      const [x,y,z]=queue[head];
      for(const [dx,dy,dz] of DIRECTIONS){
        const nx=x+dx,ny=y+dy,nz=z+dz,key=keyOf(nx,ny,nz);
        if(reachable.has(key)||this.world.get(nx,ny,nz)!=="water")continue;
        reachable.add(key);
        queue.push([nx,ny,nz]);
      }
    }

    for(const [key,id] of this.world.blocks){
      if(id!=="water")continue;
      if(!reachable.has(key)){
        const [x,y,z]=decodeKey(key);
        this.world.set(x,y,z,null,false);
        this.levels.delete(key);
        this.markChunkNeighborhood(x,z,rebuild);
      }else if(!this.levels.has(key)){
        const [x,y,z]=decodeKey(key);
        const source=this.sources.has(key);
        this.levels.set(key,{level:source?0:1,falling:!source&&this.world.get(x,y+1,z)==="water",source});
      }
    }
    this.active=new Set(reachable);
    this.world.waterStates=this.levels;
  }
}
