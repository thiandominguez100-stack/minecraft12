import * as THREE from "three";
import {BLOCKS,BLOCK_MAP} from "./data.js";

const keyOf=(x,y,z)=>String(x)+","+String(y)+","+String(z);
const hash=(x,z,seed=0)=>{
  let n=(x*374761393+z*668265263+seed*1442695041)|0;
  n=(n^(n>>>13))*1274126177;
  return ((n^(n>>>16))>>>0)/4294967295;
};

function makeTexture(def,face="side"){
  const canvas=document.createElement("canvas");
  canvas.width=16;canvas.height=16;
  const ctx=canvas.getContext("2d",{alpha:false});
  const base=new THREE.Color(def.color);
  for(let y=0;y<16;y++)for(let x=0;x<16;x++){
    const n=hash(x+y*17,def.id.length*31,def.color);
    let color=base.clone().multiplyScalar(.76+n*.42);
    if(def.accent&&n>.78)color=new THREE.Color(def.accent).multiplyScalar(.86+n*.22);
    if(def.id==="grass"){
      if(face==="top")color=new THREE.Color(0x6eaa43).multiplyScalar(.78+n*.35);
      else if(face==="bottom")color=new THREE.Color(0x80583a).multiplyScalar(.78+n*.32);
      else if(y<4)color=new THREE.Color(0x75b64b).multiplyScalar(.8+n*.3);
      else color=new THREE.Color(0x805d3e).multiplyScalar(.76+n*.34);
    }
    if(def.id==="oak_log"){
      if(face==="top"||face==="bottom"){
        const d=Math.hypot(x-7.5,y-7.5);
        color=d<2.2?new THREE.Color(0x6f482b):d<4.6?new THREE.Color(0xc49a62):new THREE.Color(0x8c6138);
      }else if(x%5===0||x%7===0)color=new THREE.Color(0x684528);
      else color=new THREE.Color(0x956b3f).multiplyScalar(.78+n*.3);
    }
    if(def.id==="leaves"){
      color=n>.75?new THREE.Color(0x74ad48):new THREE.Color(0x3f7837);
      if((x+y*3)%11===0)color=new THREE.Color(0x294f2c);
    }
    if(def.id==="water"){
      color=new THREE.Color(0x347eb7).multiplyScalar(.82+n*.2);
      if((x+y)%9===0)color=new THREE.Color(0x69b4df);
    }
    if(def.id==="sand"&&n>.75)color=new THREE.Color(0xe9d69c);
    if(def.id==="stone"&&n>.88)color=new THREE.Color(0xa0a3a5);
    if(def.id==="bedrock"&&n>.7)color=new THREE.Color(0x515253);
    ctx.fillStyle="#"+color.getHexString();ctx.fillRect(x,y,1,1);
  }
  if(def.id==="coal_ore"||def.id==="iron_ore"||def.id==="gold_ore"||def.id==="diamond_ore"){
    const ore=new THREE.Color(def.accent||0xffffff);
    for(let i=0;i<17;i++){
      const x=Math.floor(hash(i,def.color,7)*16),y=Math.floor(hash(i+21,def.color,9)*16);
      ctx.fillStyle="#"+ore.getHexString();ctx.fillRect(x,y,1+(i%3===0?1:0),1);
    }
  }
  const texture=new THREE.CanvasTexture(canvas);
  texture.magFilter=THREE.NearestFilter;
  texture.minFilter=THREE.NearestFilter;
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.generateMipmaps=false;
  return texture;
}

export class VoxelWorld{
  constructor(scene,seed=20261109,options={}){
    this.scene=scene;this.seed=seed;this.blocks=new Map();this.base=new Map();this.changes=new Map();
    this.group=new THREE.Group();scene.add(this.group);
    this.geometry=new THREE.BoxGeometry(1,1,1);this.materials=new Map();
    const faces=["right","left","top","bottom","front","back"];
    for(const def of BLOCKS){
      const materials=faces.map(face=>new THREE.MeshLambertMaterial({
        map:makeTexture(def,face),
        transparent:!!def.transparent,
        opacity:def.id==="water"?.78:def.id==="glass"?.52:def.id==="leaves"?.98:1,
        depthWrite:def.id!=="water",
        alphaTest:def.id==="leaves"?.08:0
      }));
      this.materials.set(def.id,materials);
    }
    if(!options.defer){this.generate();this.base=new Map(this.blocks);this.rebuild()}
  }
  generateColumn(x,put){
    for(let z=-22;z<=22;z++){
      const wave=Math.sin(x*.17)*1.5+Math.cos(z*.15)*1.3+Math.sin((x+z)*.09)*1.2;
      const height=Math.max(2,Math.floor(5+wave+hash(x,z,this.seed)*1.35));
      const nearRiver=Math.abs(Math.sin(x*.11+z*.07))<.065;
      for(let y=-4;y<=height;y++){
        let id=y===height?(nearRiver?"sand":"grass"):(y>height-3?"dirt":"stone");
        if(y<0&&hash(x+y*7,z,this.seed)>.985)id="coal_ore";
        if(y<-1&&hash(x+y*11,z+23,this.seed)>.992)id="iron_ore";
        if(y<-2&&hash(x+y*13,z+57,this.seed)>.997)id="gold_ore";
        if(y<-3&&hash(x+y*17,z+91,this.seed)>.999)id="diamond_ore";
        put(x,y,z,id);
      }
      if(nearRiver&&height<5)for(let y=height+1;y<=5;y++)put(x,y,z,"water");
      const tree=hash(x,z,this.seed+3)>.986&&Math.abs(x)>3&&Math.abs(z)>3&&!nearRiver;
      if(tree){
        for(let y=1;y<=4;y++)put(x,height+y,z,"oak_log");
        for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)for(let dy=2;dy<=5;dy++){
          if(Math.abs(dx)+Math.abs(dz)+(dy===5?1:0)<5&&!(dx===0&&dz===0&&dy<5))put(x+dx,height+dy,z+dz,"leaves");
        }
      }
    }
    for(let z=-22;z<=22;z++)put(x,-4,z,"bedrock");
  }
  generate(){
    this.blocks.clear();
    const put=(x,y,z,id)=>this.blocks.set(keyOf(x,y,z),id);
    for(let x=-22;x<=22;x++)this.generateColumn(x,put);
  }
  async generateAsync(onProgress=()=>{}){
    this.blocks.clear();this.base.clear();this.changes.clear();
    const put=(x,y,z,id)=>this.blocks.set(keyOf(x,y,z),id);
    onProgress(2,"Preparando terreno");
    for(let x=-22;x<=22;x++){
      this.generateColumn(x,put);
      if((x+22)%3===0){
        onProgress(6+Math.round((x+22)/44*74),"Generando terreno y estructuras");
        await new Promise(resolve=>setTimeout(resolve,0));
      }
    }
    onProgress(84,"Construyendo mallas de bloques");
    await new Promise(resolve=>setTimeout(resolve,0));
    this.base=new Map(this.blocks);
    this.rebuild();
    onProgress(100,"Mundo listo");
  }
  get(x,y,z){return this.blocks.get(keyOf(Math.round(x),Math.round(y),Math.round(z)))||null}
  set(x,y,z,id,rebuildNow=true){
    x=Math.round(x);y=Math.round(y);z=Math.round(z);const key=keyOf(x,y,z);
    if(id&&!BLOCK_MAP[id])return false;
    if(id)this.blocks.set(key,id);else this.blocks.delete(key);
    const base=this.base.get(key)||null,now=id||null;
    if(base===now)this.changes.delete(key);else this.changes.set(key,now);
    if(rebuildNow)this.rebuild();
    return true;
  }
  isSolid(x,y,z){
    const id=this.get(x,y,z);
    if(!id)return false;
    return BLOCK_MAP[id]?.solid!==false&&id!=="water"&&id!=="leaves"&&id!=="torch";
  }
  highest(x,z){
    for(let y=24;y>=-4;y--){const id=this.get(x,y,z);if(id&&this.isSolid(x,y,z))return y}
    return 2;
  }
  collides(pos,r=.29,height=1.8){
    const feet=pos.y-1.62,lo=Math.floor(feet+.08+.5),hi=Math.floor(feet+height-.08+.5);
    for(const x of [pos.x-r,pos.x+r])for(const z of [pos.z-r,pos.z+r])for(let y=lo;y<=hi;y++){
      if(this.isSolid(Math.floor(x+.5),y,Math.floor(z+.5)))return true;
    }
    return false;
  }
  rebuild(){
    this.group.clear();
    const grouped=new Map();
    for(const [key,id] of this.blocks){
      if(!grouped.has(id))grouped.set(id,[]);
      grouped.get(id).push(key.split(",").map(Number));
    }
    for(const [id,coords] of grouped){
      const mesh=new THREE.InstancedMesh(this.geometry,this.materials.get(id),coords.length);
      mesh.userData.blockId=id;mesh.userData.coords=coords;
      mesh.castShadow=false;mesh.receiveShadow=false;
      const dummy=new THREE.Object3D();
      coords.forEach((position,index)=>{
        dummy.position.set(position[0],position[1],position[2]);
        dummy.updateMatrix();mesh.setMatrixAt(index,dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();this.group.add(mesh);
    }
  }
  resolveHit(hit){
    if(!hit||hit.instanceId===undefined)return null;
    const coords=hit.object.userData.coords?.[hit.instanceId];
    if(!coords)return null;
    return {x:coords[0],y:coords[1],z:coords[2],id:hit.object.userData.blockId};
  }
  exportChanges(){return [...this.changes.entries()]}
  importChanges(entries){
    for(const [key,id] of entries||[]){
      const [x,y,z]=key.split(",").map(Number);
      if(id)this.blocks.set(key,id);else this.blocks.delete(key);
      this.changes.set(key,id);
    }
    this.rebuild();
  }
}
