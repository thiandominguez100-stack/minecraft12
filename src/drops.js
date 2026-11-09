import * as THREE from "three";
import {ITEM_MAP,BLOCK_MAP} from "./data.js";
import {waterSurfaceY} from "./water-surface.js";
const makeTexture=id=>{
 const canvas=document.createElement("canvas");canvas.width=16;canvas.height=16;
 const ctx=canvas.getContext("2d"),def=ITEM_MAP[id]||BLOCK_MAP[id],base=new THREE.Color(def?.color??0xc0c0c0);
 const shade=f=>"#"+base.clone().multiplyScalar(f).getHexString();
 ctx.fillStyle=shade(.56);ctx.fillRect(0,0,16,16);ctx.fillStyle=shade(.92);ctx.fillRect(2,2,12,12);
 for(let y=2;y<14;y++)for(let x=2;x<14;x++){const n=(x*17+y*31+id.length*13)%23;if(n===0||n===7){ctx.fillStyle=shade(1.18);ctx.fillRect(x,y,1,1);}}
 ctx.fillStyle=shade(1.35);ctx.fillRect(3,3,5,1);ctx.fillRect(3,4,1,4);
 const t=new THREE.CanvasTexture(canvas);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.colorSpace=THREE.SRGBColorSpace;t.generateMipmaps=false;return t;
};
export class ItemDropSystem{
 constructor(scene,world){this.scene=scene;this.world=world;this.drops=[];this.materials=new Map();this.geometry=new THREE.BoxGeometry(.28,.28,.28);this.sequence=0;}
 materialFor(id){if(!this.materials.has(id))this.materials.set(id,new THREE.MeshLambertMaterial({map:makeTexture(id),color:0xffffff}));return this.materials.get(id);}
 spawn(id,position,count=1){
  if(!ITEM_MAP[id]||!Array.isArray(position)||position.length!==3||count<=0)return null;
  const group=new THREE.Group(),mesh=new THREE.Mesh(this.geometry,this.materialFor(id));mesh.rotation.set(.22,.55,.12);group.add(mesh);
  const phase=(this.sequence++*2.3999632297)%(Math.PI*2);group.position.set(...position);this.scene.add(group);
  const drop={id,count,group,mesh,phase,age:0,velocity:new THREE.Vector3(Math.sin(phase)*.7,1.8,Math.cos(phase)*.7)};this.drops.push(drop);return drop;
 }
 supportHeight(x,z,fromY){const bx=Math.floor(x+.5),bz=Math.floor(z+.5);for(let y=Math.floor(fromY+.5);y>=-5;y--){const id=this.world.get(bx,y,bz);if(this.world.isSolid(bx,y,bz))return y+.5+.16;if(id==="water")return waterSurfaceY(this.world,bx,y,bz)+.16;}return -4;}
 update(dt,player,inventory,onPickup=()=>{}){
  dt=Math.max(0,Math.min(.05,Number(dt)||0));let changed=false;
  for(let i=this.drops.length-1;i>=0;i--){
   const d=this.drops[i],p=d.group.position,v=d.velocity;d.age+=dt;
   const floor=this.supportHeight(p.x,p.z,p.y),x=Math.floor(p.x+.5),y=Math.floor(p.y+.5),z=Math.floor(p.z+.5),wet=this.world.get(x,y,z)==="water";
   if(wet){const target=waterSurfaceY(this.world,x,y,z)+.16;v.y+=(target-p.y)*5*dt;v.multiplyScalar(Math.exp(-2.2*dt));}
   else if(p.y>floor){v.y-=12*dt;v.x*=Math.exp(-2.8*dt);v.z*=Math.exp(-2.8*dt);}
   else{p.y=floor;v.y=0;v.x*=Math.exp(-5*dt);v.z*=Math.exp(-5*dt);}
   p.x+=v.x*dt;p.y+=v.y*dt;p.z+=v.z*dt;if(p.y<floor){p.y=floor;if(v.y<0)v.y=0;}
   const dx=player.x-p.x,dy=(player.y-.82)-p.y,dz=player.z-p.z,dist=Math.hypot(dx,dy,dz);
   if(dist<2.7&&dist>.001){const force=dist<1.25?8:3.6;v.x+=dx/dist*force*dt;v.y+=dy/dist*force*dt;v.z+=dz/dist*force*dt;}
   if(dist<1.25){const remaining=inventory.add(d.id,d.count),picked=d.count-remaining;if(picked){d.count=remaining;changed=true;}if(d.count<=0){this.removeAt(i);continue;}}
   d.mesh.rotation.y+=dt*1.35;d.mesh.position.y=Math.sin(d.age*3.1+d.phase)*.035;d.group.rotation.y=Math.sin(d.age*1.7+d.phase)*.14;
  }
  if(changed)onPickup();
 }
 removeAt(i){const [d]=this.drops.splice(i,1);if(d)this.scene.remove(d.group);}
 serialize(){return this.drops.map(d=>({id:d.id,count:d.count,position:d.group.position.toArray(),velocity:d.velocity.toArray(),age:d.age}));}
 restore(entries=[]){for(const e of entries){if(!e||!ITEM_MAP[e.id]||!Array.isArray(e.position)||e.position.length!==3)continue;const d=this.spawn(e.id,e.position,Math.max(1,Math.floor(e.count)||1));if(Array.isArray(e.velocity)&&e.velocity.length===3)d.velocity.fromArray(e.velocity);d.age=Math.max(0,Number(e.age)||0);}}
 clear(){for(const d of this.drops)this.scene.remove(d.group);this.drops.length=0;for(const m of this.materials.values()){m.map?.dispose();m.dispose();}this.materials.clear();this.geometry.dispose();}
}