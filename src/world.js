import * as THREE from "three";
import {BLOCKS,BLOCK_MAP} from "./data.js";
import {
  CHUNK_SIZE,CHUNKS_X,CHUNKS_Z,TOTAL_CHUNKS,WORLD_MIN_X,WORLD_MIN_Z,
  WORLD_WIDTH,WORLD_DEPTH,WORLD_MAX_X,WORLD_MAX_Z,WATER_LEVEL,
  hash,terrainSample,chunkAddress,isInsideWorld
} from "./terrain.js";

const keyOf=(x,y,z)=>String(x)+","+String(y)+","+String(z);

function makeTexture(def,face="side"){
  const canvas=document.createElement("canvas");canvas.width=16;canvas.height=16;
  const ctx=canvas.getContext("2d",{alpha:false});
  const base=new THREE.Color(def.color);
  for(let y=0;y<16;y++)for(let x=0;x<16;x++){
    const n=hash(Math.floor(x/2),Math.floor(y/2),def.color+def.id.length*31);
    let color=base.clone().multiplyScalar(.91+n*.16);
    if(def.id==="grass"){
      if(face==="top"){
        color=new THREE.Color(0x79b94b).multiplyScalar(.88+n*.2);
        if((x*7+y*11)%37===0)color=new THREE.Color(0x58953c);
      }else if(face==="bottom")color=new THREE.Color(0x80583d).multiplyScalar(.9+n*.16);
      else if(y<4)color=new THREE.Color(0x75b64b).multiplyScalar(.9+n*.16);
      else color=new THREE.Color(0x805d3e).multiplyScalar(.9+n*.17);
    }
    if(def.id==="dirt"||def.id==="sand"||def.id==="clay"||def.id==="moss"){
      if(n>.91)color.multiplyScalar(1.12);
      if(n<.09)color.multiplyScalar(.88);
    }
    if(def.id==="oak_log"){
      if(face==="top"||face==="bottom"){
        const d=Math.hypot(x-7.5,y-7.5);
        color=d<2?new THREE.Color(0x684326):d<4.5?new THREE.Color(0xc69a5e):new THREE.Color(0x916438);
      }else if(x%5===0||x%7===0)color=new THREE.Color(0x684528);
      else color=new THREE.Color(0x956b3f).multiplyScalar(.9+n*.16);
    }
    if(def.id==="leaves"){
      color=n>.65?new THREE.Color(0x579343):new THREE.Color(0x3f7837);
      if((x*13+y*7)%53===0)color=new THREE.Color(0x2d5c2c);
      if((x+y*3)%17===0)color=new THREE.Color(0x75b84d);
    }
    if(def.id==="water"){
      color=new THREE.Color(0x347eb7).multiplyScalar(.91+n*.14);
      if(y%5===0)color=new THREE.Color(0x69b4df);
    }
    if(def.id==="stone"&&n>.86)color=new THREE.Color(0xa0a3a5);
    if(def.id==="bedrock"&&n>.7)color=new THREE.Color(0x515253);
    if(def.id==="snow")color=new THREE.Color(0xe9f2f4).multiplyScalar(.94+n*.08);
    ctx.fillStyle="#"+color.getHexString();ctx.fillRect(x,y,1,1);
  }
  if(def.id==="coal_ore"||def.id==="iron_ore"||def.id==="gold_ore"||def.id==="diamond_ore"){
    const ore=new THREE.Color(def.accent||0xffffff);
    for(let i=0;i<14;i++){
      const x=Math.floor(hash(i,def.color,7)*16),y=Math.floor(hash(i+21,def.color,9)*16);
      ctx.fillStyle="#"+ore.getHexString();ctx.fillRect(x,y,1+(i%4===0?1:0),1);
    }
  }
  const texture=new THREE.CanvasTexture(canvas);
  texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;
  texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;
  return texture;
}

export class VoxelWorld{
  constructor(scene,seed=20261109,options={}){
    this.scene=scene;this.seed=seed;
    this.blocks=new Map();this.base=new Map();this.changes=new Map();
    this.group=new THREE.Group();this.group.name="WorldChunkRoot";scene.add(this.group);
    this.geometry=new THREE.BoxGeometry(1,1,1);
    this.materials=new Map();this.chunkGroups=new Map();this.chunkBlocks=new Map();
    this.chunkSize=CHUNK_SIZE;this.chunkCount=TOTAL_CHUNKS;
    this.bounds={minX:WORLD_MIN_X,maxX:WORLD_MAX_X,minZ:WORLD_MIN_Z,maxZ:WORLD_MAX_Z,width:WORLD_WIDTH,depth:WORLD_DEPTH};
    const faces=["right","left","top","bottom","front","back"];
    for(const def of BLOCKS){
      const materials=faces.map(face=>new THREE.MeshLambertMaterial({
        map:makeTexture(def,face),transparent:!!def.transparent,
        opacity:def.id==="water"?.78:def.id==="glass"?.52:def.id==="leaves"?.98:1,
        depthWrite:def.id!=="water",alphaTest:def.id==="leaves"?.06:0
      }));
      this.materials.set(def.id,materials);
    }
    if(!options.defer){this.generate();this.base=new Map(this.blocks);this.rebuild();}
  }

  putBlock(x,y,z,id){
    if(!isInsideWorld(x,z)||y<-5||y>32)return;
    this.blocks.set(keyOf(x,y,z),id);
  }

  generateColumn(x,z){
    const sample=terrainSample(x,z,this.seed);
    const {height,surface,riverDistance,lakeDistance}=sample;
    for(let y=-5;y<=height;y++){
      let id;
      if(y===-5)id="bedrock";
      else if(y===height)id=surface;
      else if(y>=height-2)id="dirt";
      else id="stone";
      if(y>=-3&&y<height-2){
        const ore=hash(x+y*17,z+y*29,this.seed+101);
        if(y<2&&ore>.993)id="diamond_ore";
        else if(y<5&&ore>.985)id="gold_ore";
        else if(ore>.955)id="iron_ore";
        else if(ore>.91)id="coal_ore";
      }
      this.putBlock(x,y,z,id);
    }
    if(riverDistance<1.9||lakeDistance<5.6){
      for(let y=height+1;y<=WATER_LEVEL;y++)this.putBlock(x,y,z,"water");
    }
  }

  generateTerrain(){
    this.blocks.clear();
    for(let iz=0;iz<CHUNKS_Z;iz++)for(let ix=0;ix<CHUNKS_X;ix++){
      const startX=WORLD_MIN_X+ix*CHUNK_SIZE,startZ=WORLD_MIN_Z+iz*CHUNK_SIZE;
      for(let x=startX;x<startX+CHUNK_SIZE;x++)
        for(let z=startZ;z<startZ+CHUNK_SIZE;z++)this.generateColumn(x,z);
    }
  }

  isGoodTreeSite(x,z,sample){
    return sample.biome!=="desert"&&sample.biome!=="mountain"&&
      sample.riverDistance>5&&sample.lakeDistance>7&&!(Math.hypot(x,z)<7);
  }

  placeTree(x,z){
    const sample=terrainSample(x,z,this.seed);
    if(!this.isGoodTreeSite(x,z,sample))return;
    const ground=sample.height,trunkHeight=6+Math.floor(hash(x,z,this.seed+404)*3);
    for(let y=1;y<=trunkHeight;y++)this.putBlock(x,ground+y,z,"oak_log");
    const top=ground+trunkHeight;
    for(let dy=-2;dy<=2;dy++){
      const radius=dy===2?1:dy===1?2:dy===0?3:dy===-1?3:2;
      for(let dx=-radius;dx<=radius;dx++)for(let dz=-radius;dz<=radius;dz++){
        if(dx*dx+dz*dz>radius*radius+1)continue;
        if(dx===0&&dz===0&&dy<0)continue;
        const px=x+dx,py=top+dy,pz=z+dz;
        if(!this.blocks.has(keyOf(px,py,pz)))this.putBlock(px,py,pz,"leaves");
      }
    }
    if(hash(x+5,z-3,this.seed+401)>.48)this.putBlock(x,ground+trunkHeight-1,z+1,"oak_log");
  }

  placeBoulder(x,z){
    const sample=terrainSample(x,z,this.seed);
    if(sample.biome!=="mountain"||sample.riverDistance<5)return;
    const radius=1.5+hash(x,z,this.seed+505)*1.35,centerY=sample.height+radius*.35;
    for(let dx=-3;dx<=3;dx++)for(let dz=-3;dz<=3;dz++)for(let dy=-2;dy<=3;dy++){
      const dist=Math.sqrt(dx*dx+dz*dz+(dy*.9)*(dy*.9));
      if(dist<=radius&&dy>=-1){
        const id=hash(x+dx,z+dz,this.seed+dy+510)>.25?"stone":"cobblestone";
        this.putBlock(x+dx,Math.round(centerY+dy),z+dz,id);
      }
    }
  }

  placeLandmark(){
    const cx=9,cz=13,ground=terrainSample(cx,cz,this.seed).height;
    if(terrainSample(cx,cz,this.seed).biome==="desert")return;
    for(let x=-5;x<=5;x++)for(let z=-4;z<=4;z++)
      if(Math.abs(x)===5||Math.abs(z)===4)this.putBlock(cx+x,ground,cz+z,"cobblestone");
    const pillars=[[-5,-4],[5,-4],[-5,4],[5,4]];
    for(const [px,pz] of pillars){
      const h=3+Math.floor(hash(cx+px,cz+pz,this.seed+701)*2);
      for(let y=1;y<=h;y++)this.putBlock(cx+px,ground+y,pz+cz,y===h?"moss":"stone");
    }
    for(let x=-5;x<=5;x++)for(let z=-4;z<=4;z++){
      if(Math.abs(x)===5||Math.abs(z)===4)
        for(let y=1;y<=2;y++)if(hash(x+cx,z+cz+y,this.seed+707)>.18)
          this.putBlock(cx+x,ground+y,cz+z,"stone");
    }
    this.putBlock(cx,ground+1,cz,"moss");
    this.putBlock(cx+1,ground+1,cz,"moss");
    for(let i=-2;i<=2;i++)this.putBlock(cx+i,ground+1,cz-1,"cobblestone");
  }

  generateFeatures(){
    for(let x=WORLD_MIN_X+5;x<=WORLD_MAX_X-4;x+=8)
      for(let z=WORLD_MIN_Z+5;z<=WORLD_MAX_Z-4;z+=8)
        if(hash(x,z,this.seed+303)>.43){
          const tx=x+Math.floor(hash(x,z,this.seed+304)*3)-1;
          const tz=z+Math.floor(hash(x,z,this.seed+305)*3)-1;
          this.placeTree(tx,tz);
        }
    for(let x=WORLD_MIN_X+4;x<=WORLD_MAX_X-4;x+=10)
      for(let z=WORLD_MIN_Z+4;z<=WORLD_MAX_Z-4;z+=10)
        if(hash(x,z,this.seed+606)>.48)this.placeBoulder(x,z);
    this.placeLandmark();
  }

  generate(){this.generateTerrain();this.generateFeatures();this.base=new Map(this.blocks);this.rebuild();}

  async generateAsync(onProgress=()=>{}){
    this.blocks.clear();this.base.clear();this.changes.clear();
    onProgress(2,"Preparando 12 chunks de 16 × 16");
    let built=0;
    for(let iz=0;iz<CHUNKS_Z;iz++)for(let ix=0;ix<CHUNKS_X;ix++){
      const startX=WORLD_MIN_X+ix*CHUNK_SIZE,startZ=WORLD_MIN_Z+iz*CHUNK_SIZE;
      for(let x=startX;x<startX+CHUNK_SIZE;x++)
        for(let z=startZ;z<startZ+CHUNK_SIZE;z++)this.generateColumn(x,z);
      built++;onProgress(5+Math.round(built/TOTAL_CHUNKS*48),"Generando chunk "+built+" de "+TOTAL_CHUNKS);
      await new Promise(resolve=>setTimeout(resolve,0));
    }
    onProgress(57,"Levantando bosques, riscos y estructuras");
    this.generateFeatures();await new Promise(resolve=>setTimeout(resolve,0));
    this.base=new Map(this.blocks);this.buildChunkIndex();this.group.clear();this.chunkGroups.clear();
    let rendered=0;
    for(let iz=0;iz<CHUNKS_Z;iz++)for(let ix=0;ix<CHUNKS_X;ix++){
      this.rebuildChunk(ix,iz);rendered++;
      onProgress(60+Math.round(rendered/TOTAL_CHUNKS*40),"Construyendo chunk mesh "+rendered+" de "+TOTAL_CHUNKS);
      await new Promise(resolve=>setTimeout(resolve,0));
    }
    onProgress(100,"12 chunks listos · "+this.blocks.size.toLocaleString("es-AR")+" bloques");
  }

  get(x,y,z){
    x=Math.round(x);y=Math.round(y);z=Math.round(z);
    if(!isInsideWorld(x,z))return null;
    return this.blocks.get(keyOf(x,y,z))||null;
  }
  set(x,y,z,id,rebuildNow=true){
    x=Math.round(x);y=Math.round(y);z=Math.round(z);
    if(!isInsideWorld(x,z)||y<-5||y>32)return false;
    if(id&&!BLOCK_MAP[id])return false;
    const key=keyOf(x,y,z),address=chunkAddress(x,z);
    if(id)this.blocks.set(key,id);else this.blocks.delete(key);
    const base=this.base.get(key)||null,now=id||null;
    if(base===now)this.changes.delete(key);else this.changes.set(key,now);
    if(address){
      const chunk=this.chunkBlocks.get(address.key)||new Map();
      if(id)chunk.set(key,{x,y,z,id});else chunk.delete(key);
      this.chunkBlocks.set(address.key,chunk);
      if(rebuildNow)this.rebuildChunk(address.ix,address.iz);
    }
    return true;
  }
  isSolid(x,y,z){
    const id=this.get(x,y,z);
    if(!id)return false;
    return BLOCK_MAP[id]?.solid!==false&&id!=="water"&&id!=="leaves"&&id!=="torch"&&id!=="moss";
  }
  highest(x,z){for(let y=32;y>=-5;y--){const id=this.get(x,y,z);if(id&&this.isSolid(x,y,z))return y;}return 2;}
  collides(pos,r=.29,height=1.8){
    const epsilon=1e-5,feet=pos.y-1.62,head=feet+height;
    const minX=Math.floor(pos.x-r+.5+epsilon),maxX=Math.floor(pos.x+r+.5-epsilon);
    const minY=Math.floor(feet+.5+epsilon),maxY=Math.floor(head+.5-epsilon);
    const minZ=Math.floor(pos.z-r+.5+epsilon),maxZ=Math.floor(pos.z+r+.5-epsilon);
    for(let x=minX;x<=maxX;x++)for(let y=minY;y<=maxY;y++)for(let z=minZ;z<=maxZ;z++)
      if(this.isSolid(x,y,z))return true;
    return false;
  }
  findGroundSurface(pos,r=.29,maxGap=.12,maxPenetration=.12){
    const feet=pos.y-1.62,samples=[[0,0,true],[-r*.8,-r*.8,false],[r*.8,-r*.8,false],[-r*.8,r*.8,false],[r*.8,r*.8,false]];
    const counts=new Map(),firstY=Math.floor(feet+.5);
    for(const [dx,dz,isCenter] of samples){
      const bx=Math.floor(pos.x+dx+.5),bz=Math.floor(pos.z+dz+.5);
      for(let by=firstY;by>=firstY-2;by--){
        if(!this.isSolid(bx,by,bz))continue;
        const top=by+.5,gap=feet-top;
        if(gap>=-maxPenetration&&gap<=maxGap){
          const key=String(top),entry=counts.get(key)||{top,count:0,center:false};
          entry.count++;entry.center=entry.center||isCenter;counts.set(key,entry);break;
        }
      }
    }
    const best=[...counts.values()].sort((a,b)=>b.count-a.count||b.top-a.top)[0];
    return best&&(best.count>=3||(best.center&&best.count>=2))?best.top:null;
  }
  buildChunkIndex(){
    this.chunkBlocks.clear();
    for(let iz=0;iz<CHUNKS_Z;iz++)for(let ix=0;ix<CHUNKS_X;ix++)this.chunkBlocks.set(ix+","+iz,new Map());
    for(const [key,id] of this.blocks){
      const [x,y,z]=key.split(",").map(Number),address=chunkAddress(x,z);
      if(address)this.chunkBlocks.get(address.key).set(key,{x,y,z,id});
    }
  }
  rebuildChunk(ix,iz){
    const chunkKey=ix+","+iz,previous=this.chunkGroups.get(chunkKey);
    if(previous){this.group.remove(previous);previous.clear();}
    const chunkGroup=new THREE.Group();chunkGroup.name="Chunk "+ix+","+iz;
    chunkGroup.userData={chunkX:ix,chunkZ:iz,blockSize:CHUNK_SIZE};
    const entries=this.chunkBlocks.get(chunkKey)||new Map(),grouped=new Map();
    for(const item of entries.values()){
      if(!grouped.has(item.id))grouped.set(item.id,[]);
      grouped.get(item.id).push([item.x,item.y,item.z]);
    }
    for(const [id,coords] of grouped){
      const mesh=new THREE.InstancedMesh(this.geometry,this.materials.get(id),coords.length);
      mesh.userData.blockId=id;mesh.userData.coords=coords;mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
      const dummy=new THREE.Object3D();
      coords.forEach((position,index)=>{dummy.position.set(position[0],position[1],position[2]);dummy.updateMatrix();mesh.setMatrixAt(index,dummy.matrix);});
      mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();chunkGroup.add(mesh);
    }
    this.chunkGroups.set(chunkKey,chunkGroup);this.group.add(chunkGroup);
  }
  rebuild(){
    this.group.clear();this.chunkGroups.clear();this.buildChunkIndex();
    for(let iz=0;iz<CHUNKS_Z;iz++)for(let ix=0;ix<CHUNKS_X;ix++)this.rebuildChunk(ix,iz);
  }
  resolveHit(hit){
    if(!hit||hit.instanceId===undefined)return null;
    const coords=hit.object.userData.coords?.[hit.instanceId];
    if(!coords)return null;
    return {x:coords[0],y:coords[1],z:coords[2],id:hit.object.userData.blockId};
  }
  exportChanges(){return [...this.changes.entries()];}
  importChanges(entries){
    for(const [key,id] of entries||[]){
      const [x,y,z]=key.split(",").map(Number);
      if(!isInsideWorld(x,z)||y<-5||y>32||id&&!BLOCK_MAP[id])continue;
      if(id)this.blocks.set(key,id);else this.blocks.delete(key);
      this.changes.set(key,id);
    }
    this.rebuild();
  }
  getChunkSummary(){return {count:this.chunkGroups.size,size:CHUNK_SIZE,chunksX:CHUNKS_X,chunksZ:CHUNKS_Z,blockCount:this.blocks.size,bounds:this.bounds};}
}
