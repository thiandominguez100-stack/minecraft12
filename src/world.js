import * as THREE from "three";
import {BLOCKS,BLOCK_MAP} from "./data.js";

const k=(x,y,z)=>`${x},${y},${z}`;
const hash=(x,z,seed=0)=>{let n=(x*374761393+z*668265263+seed*1442695041)|0;n=(n^(n>>>13))*1274126177;return ((n^(n>>>16))>>>0)/4294967295};

function makeTexture(def){
  const c=document.createElement("canvas");c.width=16;c.height=16;
  const ctx=c.getContext("2d");ctx.fillStyle="#"+def.color.toString(16).padStart(6,"0");ctx.fillRect(0,0,16,16);
  const base=new THREE.Color(def.color);
  for(let y=0;y<16;y++)for(let x=0;x<16;x++){
    const n=hash(x+y*17,def.id.length*31,def.color);
    let col=base.clone().multiplyScalar(.78+n*.38);
    if(def.accent&&n>.81)col=new THREE.Color(def.accent);
    if(def.id==="grass"&&y<5)col=new THREE.Color(0x78b94b).multiplyScalar(.82+n*.32);
    if(def.id==="oak_log"&&(x<3||x>12))col=new THREE.Color(0x644328).multiplyScalar(.8+n*.3);
    if(def.id==="leaves"&&n>.64)col=new THREE.Color(0x65a548).multiplyScalar(.7+n*.35);
    ctx.fillStyle="#"+col.getHexString();ctx.fillRect(x,y,1,1);
  }
  const tex=new THREE.CanvasTexture(c);tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;tex.colorSpace=THREE.SRGBColorSpace;return tex;
}

export class VoxelWorld{
  constructor(scene,seed=20261109){
    this.scene=scene;this.seed=seed;this.blocks=new Map();this.base=new Map();this.changes=new Map();this.group=new THREE.Group();scene.add(this.group);
    this.geometry=new THREE.BoxGeometry(1,1,1);this.materials=new Map();
    for(const d of BLOCKS)this.materials.set(d.id,new THREE.MeshLambertMaterial({map:makeTexture(d),transparent:!!d.transparent,opacity:d.id==="water"?.72:d.id==="glass"?.48:d.id==="leaves"?.96:1,depthWrite:d.id!=="water"}));
    this.generate();
    this.base=new Map(this.blocks);this.rebuild();
  }
  generate(){
    this.blocks.clear();
    const put=(x,y,z,id)=>this.blocks.set(k(x,y,z),id);
    for(let x=-22;x<=22;x++)for(let z=-22;z<=22;z++){
      const wave=Math.sin(x*.17)*1.5+Math.cos(z*.15)*1.3+Math.sin((x+z)*.09)*1.2;
      const h=Math.max(2,Math.floor(5+wave+hash(x,z,this.seed)*1.35));
      const nearRiver=Math.abs(Math.sin(x*.11+z*.07))<.065;
      for(let y=-4;y<=h;y++){
        let id=y===h?(nearRiver?"sand":"grass"):(y>h-3?"dirt":"stone");
        if(y<0&&hash(x+y*7,z,this.seed)>.985)id="coal_ore";
        if(y<-1&&hash(x+y*11,z+23,this.seed)>.992)id="iron_ore";
        if(y<-2&&hash(x+y*13,z+57,this.seed)>.997)id="gold_ore";
        if(y<-3&&hash(x+y*17,z+91,this.seed)>.999)id="diamond_ore";
        put(x,y,z,id);
      }
      if(nearRiver&&h<5){for(let y=h+1;y<=5;y++)put(x,y,z,"water")}
      const tree=hash(x,z,this.seed+3)>.986&&Math.abs(x)>3&&Math.abs(z)>3&&!nearRiver;
      if(tree){for(let y=1;y<=4;y++)put(x,h+y,z,"oak_log");for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)for(let dy=2;dy<=5;dy++)if(Math.abs(dx)+Math.abs(dz)+(dy===5?1:0)<5&&!(dx===0&&dz===0&&dy<5))put(x+dx,h+dy,z+dz,"leaves")}
    }
    // Anillo de roca madre en el subsuelo.
    for(let x=-22;x<=22;x++)for(let z=-22;z<=22;z++)put(x,-4,z,"bedrock");
  }
  get(x,y,z){return this.blocks.get(k(Math.round(x),Math.round(y),Math.round(z)))||null}
  set(x,y,z,id,rebuildNow=true){
    x=Math.round(x);y=Math.round(y);z=Math.round(z);const key=k(x,y,z);
    if(id&&!BLOCK_MAP[id])return false;
    if(id)this.blocks.set(key,id);else this.blocks.delete(key);
    const base=this.base.get(key)||null,now=id||null;
    if(base===now)this.changes.delete(key);else this.changes.set(key,now);
    if(rebuildNow)this.rebuild();return true;
  }
  isSolid(x,y,z){const id=this.get(x,y,z);if(!id)return false;return BLOCK_MAP[id]?.solid!==false&&id!=="water"&&id!=="leaves"&&id!=="torch"}
  highest(x,z){for(let y=24;y>=-4;y--){const id=this.get(x,y,z);if(id&&this.isSolid(x,y,z))return y}return 2}
  collides(pos,r=.29,height=1.8){
    const feet=pos.y-1.62,lo=Math.floor(feet+.08+.5),hi=Math.floor(feet+height-.08+.5);
    for(const x of [pos.x-r,pos.x+r])for(const z of [pos.z-r,pos.z+r])for(let y=lo;y<=hi;y++)if(this.isSolid(Math.floor(x+.5),y,Math.floor(z+.5)))return true;
    return false;
  }
  rebuild(){
    this.group.clear()
    const grouped=new Map();for(const [key,id] of this.blocks){if(!grouped.has(id))grouped.set(id,[]);grouped.get(id).push(key.split(",").map(Number))}
    for(const [id,coords] of grouped){
      const mesh=new THREE.InstancedMesh(this.geometry,this.materials.get(id),coords.length);
      mesh.userData.blockId=id;mesh.userData.coords=coords;mesh.castShadow=false;mesh.receiveShadow=false;
      const dummy=new THREE.Object3D();
      coords.forEach((p,i)=>{dummy.position.set(p[0],p[1],p[2]);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});
      mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();this.group.add(mesh);
    }
  }
  resolveHit(hit){if(!hit||hit.instanceId===undefined)return null;const coords=hit.object.userData.coords?.[hit.instanceId];if(!coords)return null;return {x:coords[0],y:coords[1],z:coords[2],id:hit.object.userData.blockId}}
  exportChanges(){return [...this.changes.entries()]}
  importChanges(entries){for(const [key,id] of entries||[]){const [x,y,z]=key.split(",").map(Number);if(id)this.blocks.set(key,id);else this.blocks.delete(key);this.changes.set(key,id)}this.rebuild()}
}
