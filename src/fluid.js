import {chunkAddress} from "./terrain.js";

const keyOf=(x,y,z)=>String(x)+","+String(y)+","+String(z);
const decodeKey=key=>key.split(",").map(Number);
const DIRECTIONS=[[1,0],[-1,0],[0,1],[0,-1]];

/**
 * Discrete voxel-fluid simulation:
 * - source cells are permanent and never mined;
 * - water prefers to fall vertically;
 * - once blocked below, it spreads horizontally with a 7-cell decay;
 * - updates are budgeted so a large body of water cannot stall the render loop.
 */
export class WaterSimulation{
  constructor(world,{tickInterval=.28,updateBudget=48,maxLevel=7}={}){
    this.world=world;
    this.tickInterval=tickInterval;
    this.updateBudget=updateBudget;
    this.maxLevel=maxLevel;
    this.accumulator=0;
    this.sources=new Set(world.waterSources||[]);
    this.active=new Set(this.sources);
    this.levels=new Map();
    for(const key of this.sources)this.levels.set(key,{level:0,falling:false,source:true});
  }

  addSource(x,y,z){
    x=Math.round(x);y=Math.round(y);z=Math.round(z);
    const key=keyOf(x,y,z);
    if(!this.world.set(x,y,z,"water",false))return false;
    this.sources.add(key);
    this.levels.set(key,{level:0,falling:false,source:true});
    this.active.add(key);
    const address=chunkAddress(x,z);
    if(address)this.world.rebuildChunk(address.ix,address.iz);
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
      if(this.world.get(x,y,z)!=="water"&&!this.world.set(x,y,z,"water",false))continue;
      this.sources.add(key);
      this.levels.set(key,{level:0,falling:false,source:true});
      this.active.add(key);
      const address=chunkAddress(x,z);
      if(address)rebuild.add(address.key);
    }
    for(const key of rebuild){
      const [ix,iz]=key.split(",").map(Number);
      this.world.rebuildChunk(ix,iz);
    }
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
      const belowY=y-1;
      const belowId=this.world.get(x,belowY,z);
      const belowCanBeFilled=belowId===null||(belowId!=="water"&&this.world.isSolid?.(x,belowY,z)===false);
      if(y>-5&&belowCanBeFilled){
        this.placeFlow(x,belowY,z,{level:state.level,falling:true,source:false},rebuild);
        continue;
      }

      const nextLevel=state.source?1:(state.falling?1:state.level+1);
      if(nextLevel>this.maxLevel)continue;
      for(const [dx,dz] of DIRECTIONS){
        const nx=x+dx,nz=z+dz;
        if(this.world.get(nx,y,nz)!==null)continue;
        this.placeFlow(nx,y,nz,{level:nextLevel,falling:false,source:false},rebuild);
      }
    }
    for(const key of rebuild){
      const [ix,iz]=key.split(",").map(Number);
      this.world.rebuildChunk(ix,iz);
    }
    return work.length;
  }

  placeFlow(x,y,z,state,rebuild){
    if(this.world.get(x,y,z)!==null)return false;
    if(!this.world.set(x,y,z,"water",false))return false;
    const key=keyOf(x,y,z);
    this.levels.set(key,state);
    this.active.add(key);
    const address=chunkAddress(x,z);
    if(address)rebuild.add(address.key);
    return true;
  }
}
