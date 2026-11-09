import * as THREE from "three";
import {BLOCKS,BLOCK_MAP} from "./data.js";
import {makeBlockTexture} from "./textures.js";
import {blockMaterialSettings} from "./texture-spec.js";
import {buildWaterSurface,waterSurfaceY} from "./water-surface.js";
import {
  CHUNK_SIZE,CHUNKS_X,CHUNKS_Z,TOTAL_CHUNKS,WORLD_MIN_X,WORLD_MIN_Z,
  WORLD_WIDTH,WORLD_DEPTH,WORLD_MAX_X,WORLD_MAX_Z,WATER_LEVEL,
  hash,terrainSample,chunkAddress,isInsideWorld
} from "./terrain.js";

const keyOf=(x,y,z)=>String(x)+","+String(y)+","+String(z);

function makeWaterTexture(){
 const canvas=document.createElement("canvas");canvas.width=64;canvas.height=64;
 const ctx=canvas.getContext("2d");
 ctx.fillStyle="#258dcc";ctx.fillRect(0,0,64,64);
 const bands=[
  [3,8,24,2,"#54b5e4"],[27,14,31,2,"#1876b6"],[5,25,39,2,"#4aa9dc"],
  [22,34,36,2,"#176eac"],[7,46,25,2,"#55b8e8"],[37,54,22,2,"#176eac"]
 ];
 for(const [x,y,w,h,color] of bands){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);ctx.fillStyle="#b1e9ff";ctx.fillRect(x+2,y,w*.35,1);}
 for(let i=0;i<90;i++){const x=(i*37)%64,y=(i*19)%64;ctx.fillStyle=i%3?"#2f9bd3":"#74c8eb";ctx.fillRect(x,y,1,1);}
 const texture=new THREE.CanvasTexture(canvas);
 texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;
 texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=true;
 texture.wrapS=THREE.RepeatWrapping;texture.wrapT=THREE.RepeatWrapping;
 return texture;
}

export class VoxelWorld{
  constructor(scene,seed=20261109,options={}){
    this.scene=scene;this.seed=seed;
    this.blocks=new Map();this.base=new Map();this.changes=new Map();this.waterSources=new Set();this.waterStates=new Map();
    this.group=new THREE.Group();this.group.name="WorldChunkRoot";scene.add(this.group);
    this.geometry=new THREE.BoxGeometry(1,1,1);
    this.materials=new Map();this.chunkGroups=new Map();this.chunkBlocks=new Map();
    this.chunkSize=CHUNK_SIZE;this.chunkCount=TOTAL_CHUNKS;this.renderDistanceChunks=6.5;this.renderCenter={x:0,z:0,ix:NaN,iz:NaN};
    this.bounds={minX:WORLD_MIN_X,maxX:WORLD_MAX_X,minZ:WORLD_MIN_Z,maxZ:WORLD_MAX_Z,width:WORLD_WIDTH,depth:WORLD_DEPTH};
    const faces=["right","left","top","bottom","front","back"];
    for(const def of BLOCKS){
      const settings=blockMaterialSettings(def.id);
      const materials=faces.map(face=>new THREE.MeshLambertMaterial({
        map:makeBlockTexture(def,face),...settings
      }));
      this.materials.set(def.id,materials);
    }
    const waterTexture=makeWaterTexture();
    this.waterMaterial=new THREE.MeshBasicMaterial({
      map:waterTexture,color:0xffffff,transparent:false,opacity:1,
      depthWrite:true,depthTest:true,side:THREE.DoubleSide,
      fog:false,toneMapped:false
    });
    this.waterFlowTime=0;
    if(!options.defer)this.generate();
  }

  putBlock(x,y,z,id){
    if(!isInsideWorld(x,z)||y<-5||y>32)return;
    this.blocks.set(keyOf(x,y,z),id);
  }

  generateColumn(x,z){
    const sample=terrainSample(x,z,this.seed);
    const {height,surface,isWaterColumn,waterSource}=sample;
    for(let y=-5;y<=height;y++){
      let id;
      if(y===-5)id="bedrock";
      else if(y===height)id=surface;
      else if(y>=height-2)id=surface==="sand"?"sand":surface==="stone"||surface==="snow"?"stone":"dirt";
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
    if(isWaterColumn){
      for(let y=height+1;y<=WATER_LEVEL;y++)this.putBlock(x,y,z,"water");
      if(waterSource)this.waterSources.add(keyOf(x,WATER_LEVEL,z));
    }
  }

  generateTerrain(){
    this.blocks.clear();this.waterSources.clear();
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
    const ground=sample.height,trunkHeight=7+Math.floor(hash(x,z,this.seed+404)*4);
    for(let y=1;y<=trunkHeight;y++)this.putBlock(x,ground+y,z,"oak_log");
    const branchY=ground+trunkHeight-3,directions=[[1,0],[-1,0],[0,1],[0,-1]];
    for(let i=0;i<directions.length;i++){
      if(hash(x+i,z-i,this.seed+430)<.28)continue;
      const [dx,dz]=directions[i];
      this.putBlock(x+dx,branchY+1,z+dz,"oak_log");
      this.putBlock(x+dx*2,branchY+2,z+dz*2,"oak_log");
      this.putBlock(x+dx*2,branchY+3,z+dz*2,"leaves");
    }
    const top=ground+trunkHeight,layers=[1.25,2.15,3.05,3.55,3.1,2.25,1.15];
    for(let layer=0;layer<layers.length;layer++){
      const dy=layer-3,radius=layers[layer],extent=Math.ceil(radius);
      for(let dx=-extent;dx<=extent;dx++)for(let dz=-extent;dz<=extent;dz++){
        const distance=(dx*dx+dz*dz)/(radius*radius),edgeNoise=hash(x+dx,z+dz,this.seed+450+layer)*.18;
        if(distance>1.03+edgeNoise)continue;
        if(distance>.72&&hash(x+dx*3,z+dz*5,this.seed+470+layer)>.90)continue;
        const px=x+dx,py=top+dy,pz=z+dz;
        if(this.blocks.has(keyOf(px,py,pz))&&!(dx===0&&dz===0))continue;
        if(!(dx===0&&dz===0&&dy<0))this.putBlock(px,py,pz,"leaves");
      }
    }
    const clusters=[[-2,-1,0],[2,-1,1],[0,-1,-2],[0,0,2]];
    for(let c=0;c<clusters.length;c++){
      const [ox,oy,oz]=clusters[c],cy=top+oy;
      for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++)for(let dz=-2;dz<=2;dz++){
        const distance=dx*dx+dy*dy*1.15+dz*dz;
        if(distance>5.2+hash(dx+c,dz+dy,this.seed+490)*.8)continue;
        const px=x+ox+dx,py=cy+dy,pz=z+oz+dz;
        if(!this.blocks.has(keyOf(px,py,pz)))this.putBlock(px,py,pz,"leaves");
      }
    }
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

  placeLandmark(cx=9,cz=-18){
    const ground=terrainSample(cx,cz,this.seed).height;
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
    this.placeLandmark(9,-18);
    this.placeLandmark(-43,42);
    this.placeLandmark(44,-75);
  }

  generate(){this.generateTerrain();this.generateFeatures();this.base=new Map(this.blocks);this.rebuild();}

  async generateAsync(onProgress=()=>{}){
    this.blocks.clear();this.base.clear();this.changes.clear();
    onProgress(2,"Preparando "+TOTAL_CHUNKS+" chunks de 16 × 16");
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
    onProgress(100,TOTAL_CHUNKS+" chunks listos · "+this.blocks.size.toLocaleString("es-AR")+" bloques");
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
    return BLOCK_MAP[id]?.solid!==false&&id!=="water"&&id!=="leaves"&&id!=="torch";
  }
  getSubmersion(pos,r=.29,height=1.8){
    const feet=pos.y-1.62;
    const horizontal=[[0,0],[-r*.8,-r*.8],[r*.8,-r*.8],[-r*.8,r*.8],[r*.8,r*.8]];
    const vertical=[.1,.3,.5,.7,.9];
    let wet=0,total=0;
    for(const [dx,dz] of horizontal){
      const x=Math.floor(pos.x+dx+.5),z=Math.floor(pos.z+dz+.5);
      for(const fraction of vertical){
        const sampleY=feet+height*fraction;
        const y=Math.floor(sampleY+.5);
        const surface=waterSurfaceY(this,x,y,z);
        if(this.get(x,y,z)==="water"&&sampleY<=surface)wet++;
        total++;
      }
    }
    return total?wet/total:0;
  }
  isEyeUnderwater(pos){
    const x=Math.floor(pos.x+.5),y=Math.floor(pos.y+.5),z=Math.floor(pos.z+.5);
    return this.get(x,y,z)==="water"&&pos.y<=waterSurfaceY(this,x,y,z);
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
    if(previous){
      previous.traverse(object=>{if(object.userData?.dynamicWater)object.geometry.dispose();});
      this.group.remove(previous);previous.clear();
    }
    const chunkGroup=new THREE.Group();chunkGroup.name="Chunk "+ix+","+iz;
    chunkGroup.userData={chunkX:ix,chunkZ:iz,blockSize:CHUNK_SIZE};
    const entries=this.chunkBlocks.get(chunkKey)||new Map(),grouped=new Map(),waterCoords=[];
    for(const item of entries.values()){
      if(item.id==="water"){waterCoords.push([item.x,item.y,item.z]);continue;}
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
    if(waterCoords.length){
      const surface=buildWaterSurface(this,waterCoords);
      if(surface.positions.length){
        const geometry=new THREE.BufferGeometry();
        geometry.setAttribute("position",new THREE.Float32BufferAttribute(surface.positions,3));
        geometry.setAttribute("uv",new THREE.Float32BufferAttribute(surface.uvs,2));
        geometry.setAttribute("waterWave",new THREE.Float32BufferAttribute(surface.waveWeights,1));
        geometry.setIndex(surface.indices);
        geometry.computeBoundingSphere();
        const waterMesh=new THREE.Mesh(geometry,this.waterMaterial);
        waterMesh.userData={
          blockId:"water",dynamicWater:true,topFaces:surface.topFaces,
          sideFaces:surface.sideFaces,waterCellCount:waterCoords.length,
          basePositions:new Float32Array(surface.positions)
        };
        waterMesh.renderOrder=1;waterMesh.frustumCulled=false;chunkGroup.add(waterMesh);
      }
    }
    this.chunkGroupVisibility(chunkGroup,ix,iz);
     this.chunkGroups.set(chunkKey,chunkGroup);this.group.add(chunkGroup);
  }
  chunkGroupVisibility(group,ix,iz){
    const cx=WORLD_MIN_X+ix*CHUNK_SIZE+CHUNK_SIZE*.5,cz=WORLD_MIN_Z+iz*CHUNK_SIZE+CHUNK_SIZE*.5;
    const dx=cx-this.renderCenter.x,dz=cz-this.renderCenter.z,r=this.renderDistanceChunks*CHUNK_SIZE;
    group.visible=dx*dx+dz*dz<=r*r;
  }
  updateRenderDistance(x,z,radius=this.renderDistanceChunks){
    const ix=Math.floor((x-WORLD_MIN_X)/CHUNK_SIZE),iz=Math.floor((z-WORLD_MIN_Z)/CHUNK_SIZE);
    if(ix===this.renderCenter.ix&&iz===this.renderCenter.iz&&radius===this.renderDistanceChunks)return false;
    this.renderCenter={x,z,ix,iz};this.renderDistanceChunks=radius;
    for(const [key,group] of this.chunkGroups){
      const [cx,cz]=key.split(",").map(Number);this.chunkGroupVisibility(group,cx,cz);
    }
    return true;
  }
  getNearbyChunkGroups(x,z,range=1){
    const ix=Math.floor((x-WORLD_MIN_X)/CHUNK_SIZE),iz=Math.floor((z-WORLD_MIN_Z)/CHUNK_SIZE),groups=[];
    for(let dz=-range;dz<=range;dz++)for(let dx=-range;dx<=range;dx++){
      const group=this.chunkGroups.get((ix+dx)+","+(iz+dz));
      if(group)groups.push(group);
    }
    return groups;
  }
  getWaterSummary(){
    let cells=0,chunks=0,meshes=0,topFaces=0;
    for(const [key,id] of this.blocks)if(id==="water")cells++;
    for(const group of this.chunkGroups.values())for(const object of group.children){
      if(object.userData?.blockId==="water"){meshes++;chunks++;topFaces+=object.userData.topFaces||0;}
    }
    return {cells,chunks,meshes,topFaces};
  }
  updateWaterAnimation(dt){
    if(!Number.isFinite(dt)||dt<=0)return;
    this.waterFlowTime+=dt;
    const time=this.waterFlowTime;
    if(this.waterMaterial?.map){
      this.waterMaterial.map.offset.x=(this.waterMaterial.map.offset.x+dt*.026)%1;
      this.waterMaterial.map.offset.y=(this.waterMaterial.map.offset.y+dt*.009)%1;
    }
    for(const group of this.chunkGroups.values()){
      if(!group.visible)continue;
      for(const mesh of group.children){
        if(!mesh.userData?.dynamicWater)continue;
        const position=mesh.geometry.attributes.position;
        const weights=mesh.geometry.attributes.waterWave;
        const base=mesh.userData.basePositions;
        if(!position||!weights||!base)continue;
        const array=position.array;
        for(let i=0;i<weights.count;i++){
          const offset=i*3,x=base[offset],z=base[offset+2],weight=weights.getX(i);
          const broad=Math.sin(x*.82+time*1.18)*Math.cos(z*.73-time*.91);
          const ripple=Math.sin((x+z)*.57-time*.72);
          array[offset+1]=base[offset+1]+weight*(broad*.024+ripple*.009);
        }
        position.needsUpdate=true;
      }
    }
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
      if(id!=="water")this.waterSources.delete(key);
      this.changes.set(key,id);
    }
    this.rebuild();
  }
  getChunkSummary(){return {count:this.chunkGroups.size,size:CHUNK_SIZE,chunksX:CHUNKS_X,chunksZ:CHUNKS_Z,blockCount:this.blocks.size,bounds:this.bounds};}
}
