import * as THREE from "three";
import {WORLD_MIN_X,WORLD_MIN_Z,WORLD_MAX_X,WORLD_MAX_Z,WORLD_WIDTH,WORLD_DEPTH} from "./terrain.js";

const seeded=(n)=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const sharedMaterials=new Map(),atlasTextures=new Map(),cubeGeometries=new Map();
function material(color){
 const key=Number(color).toString(16);
 if(!sharedMaterials.has(key))sharedMaterials.set(key,new THREE.MeshLambertMaterial({color,flatShading:true}));
 return sharedMaterials.get(key);
}
function creatureAtlas(type){
  if(atlasTextures.has(type))return new THREE.MeshLambertMaterial({map:atlasTextures.get(type),flatShading:true});
  const canvas=document.createElement("canvas");canvas.width=64;canvas.height=32;
  const ctx=canvas.getContext("2d",{alpha:false});
  const palettes={
    sheep:{body:"#e8e6db",head:"#c7ad96",legs:"#5b5047",accent:"#f4f1e8",shade:"#c7c5bc"},
    cow:{body:"#eee9df",head:"#d7b99e",legs:"#554942",accent:"#51443e",shade:"#b87865"},
    chicken:{body:"#f1eee5",head:"#eee9db",legs:"#d4a632",accent:"#c94b48",shade:"#d7d3c9"}
  };
  const p=palettes[type],regions=[[0,0,32,16,p.body,p.shade],[32,0,16,16,p.head,p.shade],[48,0,16,16,p.legs,p.shade],[0,16,16,16,p.accent,p.shade]];
  ctx.fillStyle="#302d2a";ctx.fillRect(0,0,64,32);
  for(const [x,y,w,h,base,shade] of regions){
    ctx.fillStyle=base;ctx.fillRect(x,y,w,h);
    for(let py=y;py<y+h;py++)for(let px=x;px<x+w;px++){
      const n=(px*13+py*29+type.length*17)%19;
      if(n===0||n===7){ctx.fillStyle=shade;ctx.fillRect(px,py,1,1);}
    }
  }
  if(type==="cow"){
    ctx.fillStyle=p.accent;ctx.fillRect(4,3,8,5);ctx.fillRect(19,9,7,5);ctx.fillRect(27,1,4,4);ctx.fillRect(37,4,4,5);
  }else if(type==="sheep"){
    ctx.fillStyle="#faf8ef";for(let i=0;i<18;i++)ctx.fillRect((i*7)%32,(i*11)%16,1,1);
  }else{
    ctx.fillStyle="#c94b48";ctx.fillRect(35,1,7,4);ctx.fillRect(0,16,9,9);
    ctx.fillStyle="#f5c545";ctx.fillRect(10,21,5,3);
  }
  const texture=new THREE.CanvasTexture(canvas);
  texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;
  texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;atlasTextures.set(type,texture);
  return new THREE.MeshLambertMaterial({map:texture,flatShading:true});
}
function getCubeGeometry(size,uvRect=[0,0,1,1]){
 const geometryKey=[...size,...uvRect].map(v=>Number(v).toFixed(3)).join(":");
 let geometry=cubeGeometries.get(geometryKey);
 if(!geometry){
  geometry=new THREE.BoxGeometry(size[0],size[1],size[2]);const uv=geometry.attributes.uv;
  for(let i=0;i<uv.count;i++)uv.setXY(i,uvRect[0]+uv.getX(i)*(uvRect[2]-uvRect[0]),uvRect[1]+uv.getY(i)*(uvRect[3]-uvRect[1]));
  uv.needsUpdate=true;cubeGeometries.set(geometryKey,geometry);
 }
 return geometry;
}
function cube(parent,mat,size,position,uvRect=[0,0,1,1]){
 const mesh=new THREE.Mesh(getCubeGeometry(size,uvRect),mat);
 mesh.position.set(...position);mesh.castShadow=false;mesh.receiveShadow=false;
 parent.add(mesh);return mesh;
}
function mergeStaticMeshes(parent){
 const meshes=parent.children.filter(child=>child.isMesh&&!child.isInstancedMesh);
 if(meshes.length<2)return [];
 const grouped=new Map();
 for(const mesh of meshes){
  mesh.updateMatrix();
  let batch=grouped.get(mesh.material);
  if(!batch){batch={positions:[],normals:[],uvs:[],indices:[]};grouped.set(mesh.material,batch);}
  const geometry=mesh.geometry,position=geometry.attributes.position,normal=geometry.attributes.normal,uv=geometry.attributes.uv;
  const vertexOffset=batch.positions.length/3,normalMatrix=new THREE.Matrix3().getNormalMatrix(mesh.matrix),temp=new THREE.Vector3(),tempNormal=new THREE.Vector3();
  for(let i=0;i<position.count;i++){
   temp.fromBufferAttribute(position,i).applyMatrix4(mesh.matrix);batch.positions.push(temp.x,temp.y,temp.z);
   if(normal){tempNormal.fromBufferAttribute(normal,i).applyMatrix3(normalMatrix).normalize();batch.normals.push(tempNormal.x,tempNormal.y,tempNormal.z);}
   if(uv)batch.uvs.push(uv.getX(i),uv.getY(i));else batch.uvs.push(0,0);
  }
  const index=geometry.index;
  if(index)for(let i=0;i<index.count;i++)batch.indices.push(index.getX(i)+vertexOffset);
  else for(let i=0;i<position.count;i++)batch.indices.push(i+vertexOffset);
 }
 const materialList=[...grouped.keys()],combinedGeometry=new THREE.BufferGeometry();
 const positions=[],normals=[],uvs=[],indices=[];
 for(const [material,batch] of grouped){
  const start=indices.length,offset=positions.length/3;
  positions.push(...batch.positions);normals.push(...batch.normals);uvs.push(...batch.uvs);
  for(const index of batch.indices)indices.push(index+offset);
  combinedGeometry.addGroup(start,batch.indices.length,materialList.indexOf(material));
 }
 combinedGeometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
 if(normals.length===positions.length)combinedGeometry.setAttribute("normal",new THREE.Float32BufferAttribute(normals,3));
 else combinedGeometry.computeVertexNormals();
 combinedGeometry.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));
 combinedGeometry.setIndex(indices);combinedGeometry.computeBoundingSphere();
 for(const mesh of meshes)parent.remove(mesh);
 const combined=new THREE.Mesh(combinedGeometry,materialList);
 combined.castShadow=false;combined.receiveShadow=false;combined.userData.mergedCreatureParts=true;parent.add(combined);
 return [combinedGeometry];
}
function updateLegInstances(mob,walking,swing){
 const scale=mob.legScale,positions=mob.legPositions,offset=mob.legOffset;
 for(let i=0;i<4;i++){
  const [x,z]=positions[i],angle=walking?swing*(i%2===0?1:-1):swing*.12;
  mob.legDummy.position.set(x*scale,.48*scale,z*scale);
  mob.legDummy.rotation.set(angle,0,0);mob.legDummy.updateMatrix();
  mob.legMatrix.copy(mob.legDummy.matrix).multiply(offset);
  mob.legMesh.setMatrixAt(i,mob.legMatrix);
 }
 mob.legMesh.instanceMatrix.needsUpdate=true;
}
function makeMobHitbox(type){
 const size=type==="chicken"?[.9,1.9,1]:[1.05,1.9,1.2];
 const hitbox=new THREE.Object3D();hitbox.position.y=.95;
 hitbox.userData.localBox=new THREE.Box3(
  new THREE.Vector3(-size[0]/2,-size[1]/2,-size[2]/2),
  new THREE.Vector3(size[0]/2,size[1]/2,size[2]/2)
 );
 hitbox.raycast=function(raycaster,intersections){
  const inverse=new THREE.Matrix4().copy(this.matrixWorld).invert();
  const localRay=raycaster.ray.clone().applyMatrix4(inverse);
  const localPoint=localRay.intersectBox(this.userData.localBox,new THREE.Vector3());
  if(!localPoint)return;
  const point=localPoint.applyMatrix4(this.matrixWorld);
  const distance=raycaster.ray.origin.distanceTo(point);
  if(distance<raycaster.near||distance>raycaster.far)return;
  intersections.push({distance,point,object:this});
 };
 return hitbox;
}

export class MobSystem{
  constructor(scene,world,seed=1){this.scene=scene;this.world=world;this.seed=seed;this.mobs=[];this.clock=0;this.spawn();}
  spawn(){
    const palette=["sheep","sheep","cow","chicken","sheep","cow","chicken","cow","sheep","chicken","cow","sheep","sheep","chicken","cow","sheep","cow","chicken"];const types=Array.from({length:30},(_,i)=>palette[i%palette.length]);let placed=0;
    for(let i=0;i<types.length&&placed<types.length;i++){
      const x=Math.round(WORLD_MIN_X+8+seeded(this.seed+i*7)*(WORLD_WIDTH-16)),z=Math.round(WORLD_MIN_Z+8+seeded(this.seed+i*13+4)*(WORLD_DEPTH-16));
      const y=this.world.highest(x,z),surface=this.world.get(x,y,z);
      if(!surface||!["grass","sand"].includes(surface)||this.world.get(x,y+1,z))continue;
      const mob=this.create(types[i],x,y+.5,z,i);this.mobs.push(mob);this.scene.add(mob.root);placed++;
    }
    if(this.mobs.length<3)for(let i=0;i<5;i++){
      const x=6+i*2,z=5+(i%2)*3,y=this.world.highest(x,z);
      if(["grass","sand"].includes(this.world.get(x,y,z))&&!this.world.get(x,y+1,z)){
        const mob=this.create(i%2?"sheep":"chicken",x,y+.5,z,i+20);this.mobs.push(mob);this.scene.add(mob.root);
      }
    }
  }
  create(type,x,y,z,index){
    const root=new THREE.Group();root.position.set(x,y,z);
    const atlas=creatureAtlas(type),palette={body:atlas,head:atlas,leg:atlas,accent:atlas};
    const scale=type==="chicken"?.62:1,bodyGroup=new THREE.Group();bodyGroup.position.y=.78*scale;root.add(bodyGroup);
    cube(bodyGroup,palette.body,[.88*scale,.7*scale,1.15*scale],[0,0,0],[0,0,.5,.5]);
    if(type==="sheep")for(let dx of [-.34,0,.34])for(let dz of [-.35,.2]){
      if(dx===0&&dz===.2)continue;
      cube(bodyGroup,palette.accent,[.38,.39,.39],[dx,.05,dz],[0,.5,.25,1]);
    }
    if(type==="cow"){
      cube(bodyGroup,palette.accent,[.16,.22,.04],[-.22,.12,.59]);
      cube(bodyGroup,palette.accent,[.2,.18,.04],[.25,-.08,-.59]);
      cube(bodyGroup,palette.accent,[.12,.18,.04],[-.2,-.2,-.35]);
    }
    if(type==="cow"||type==="sheep"){
      const tail=cube(bodyGroup,palette.leg,[.09,.42,.09],[0,.10*scale,-.67*scale]);tail.rotation.x=-.35;
    }
    const headPivot=new THREE.Group();headPivot.position.set(0,.22*scale,.72*scale);bodyGroup.add(headPivot);
    cube(headPivot,palette.head,[.42*scale,.42*scale,.42*scale],[0,0,.08*scale],[.5,0,.75,.5]);
    if(type==="cow"){
      cube(headPivot,palette.accent,[.12,.12,.14],[-.23,.25,.05]);cube(headPivot,palette.accent,[.12,.12,.14],[.23,.25,.05]);
      cube(headPivot,material(0x352c29),[.25,.16,.12],[0,-.1,.31]);
      cube(headPivot,material(0xf1eee4),[.08,.07,.08],[-.11,.22,.27]);cube(headPivot,material(0xf1eee4),[.08,.07,.08],[.11,.22,.27]);
    }else if(type==="sheep"){
      cube(headPivot,material(0x272727),[.07,.07,.04],[-.12,.05,.3]);cube(headPivot,material(0x272727),[.07,.07,.04],[.12,.05,.3]);
    }else{
      cube(headPivot,palette.accent,[.08,.19,.09],[0,.28,.02]);cube(headPivot,material(0xe5b338),[.2,.12,.22],[0,-.06,.27]);
      cube(headPivot,material(0x272727),[.04,.04,.03],[-.1,.03,.25]);cube(headPivot,material(0x272727),[.04,.04,.03],[.1,.03,.25]);
    }
    const legPositions=[[-.25,-.3],[.25,-.3],[-.25,.32],[.25,.32]];
    const legGeometry=getCubeGeometry([.2*scale,.58*scale,.2*scale],[.75,0,1,.5]);
    const legMesh=new THREE.InstancedMesh(legGeometry,palette.leg,4);
    legMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);legMesh.castShadow=false;legMesh.receiveShadow=false;root.add(legMesh);
    const hitbox=makeMobHitbox(type);root.add(hitbox);
    const mob={
      type,root,bodyGroup,headPivot,legMesh,legPositions,legScale:scale,
      legDummy:new THREE.Object3D(),legMatrix:new THREE.Matrix4(),
      legOffset:new THREE.Matrix4().makeTranslation(0,-.23*scale,0),
      staticGeometries:[...mergeStaticMeshes(bodyGroup),...mergeStaticMeshes(headPivot)],
      index,atlas,hitbox,
      hp:type==="chicken"?2:4,maxHp:type==="chicken"?2:4,
      drop:type==="sheep"?"wool":type==="cow"?"raw_beef":"raw_chicken",
      phase:seeded(index+this.seed)*Math.PI*2,state:"idle",timer:1+seeded(index+9)*3,
      target:new THREE.Vector3(x,y,z),origin:new THREE.Vector3(x,y,z),speed:type==="chicken"?1.05:.72,
      knockback:new THREE.Vector3(),hitFlash:0
    };
    hitbox.userData.mob=mob;updateLegInstances(mob,false,0);return mob;
  }
  pick(raycaster){
    const candidates=this.mobs.filter(m=>m.hp>0&&m.root.visible).map(m=>m.hitbox);
    if(!candidates.length)return null;
    const hits=raycaster.intersectObjects(candidates,false);
    return hits.length?{mob:hits[0].object.userData.mob,distance:hits[0].distance}:null;
  }
  hit(mob,direction){
    if(!mob||mob.hp<=0||!this.mobs.includes(mob))return null;
    mob.hp--;mob.hitFlash=.22;
    const away=direction?.clone?.()||new THREE.Vector3(1,0,0);
    away.y=0;if(away.lengthSq()<.001)away.set(1,0,0);away.normalize();
    mob.knockback.addScaledVector(away,3.2);
    mob.target.copy(mob.root.position).addScaledVector(away,4.5);
    mob.state="flee";mob.timer=2.5;
    if(mob.hp<=0){
      this.scene.remove(mob.root);mob.staticGeometries.forEach(geometry=>geometry.dispose());
      mob.atlas.dispose();
      const index=this.mobs.indexOf(mob);if(index>=0)this.mobs.splice(index,1);
      return {type:mob.type,hp:0,removed:true,drop:mob.drop};
    }
    return {type:mob.type,hp:mob.hp,maxHp:mob.maxHp,removed:false,drop:null};
  }
  update(dt,time,playerPosition=null,visibleDistance=84){
    this.clock=time;const maxDistanceSq=visibleDistance*visibleDistance;
    for(const mob of [...this.mobs]){
      if(mob.hp<=0)continue;
      if(playerPosition){
        const dx=mob.root.position.x-playerPosition.x,dz=mob.root.position.z-playerPosition.z;
        const distanceSq=dx*dx+dz*dz;
        mob.root.visible=distanceSq<=maxDistanceSq;
        if(!mob.root.visible)continue;
      }
      if(mob.hitFlash>0){mob.hitFlash=Math.max(0,mob.hitFlash-dt);mob.atlas.color.set(mob.hitFlash>0?0xff7777:0xffffff);}
      if(mob.knockback.lengthSq()>.002){
        const push=mob.knockback.clone().multiplyScalar(dt),nx=mob.root.position.x+push.x,nz=mob.root.position.z+push.z;
        const gx=Math.round(nx),gz=Math.round(nz),ground=this.world.highest(gx,gz);
        if(!this.world.isSolid(gx,ground+1,gz)&&!this.world.isSolid(gx,ground+2,gz)){
          mob.root.position.x=nx;mob.root.position.z=nz;mob.root.position.y=ground+.5;
        }
        mob.knockback.multiplyScalar(Math.exp(-8*dt));
      }
      mob.timer-=dt;
      if(mob.timer<=0){
        if(mob.state==="walk"||mob.state==="flee"){mob.state="idle";mob.timer=1.3+seeded(mob.index+Math.floor(time))*2.2;}
        else{
          const angle=seeded(mob.index+Math.floor(time*2)+this.seed)*Math.PI*2,distance=2+seeded(mob.index+Math.floor(time*3))*4;
          mob.target.set(
            Math.max(WORLD_MIN_X+4,Math.min(WORLD_MAX_X-4,mob.origin.x+Math.cos(angle)*distance)),
            0,
            Math.max(WORLD_MIN_Z+4,Math.min(WORLD_MAX_Z-4,mob.origin.z+Math.sin(angle)*distance))
          );
          mob.state="walk";mob.timer=3.5;
        }
      }
      let walking=false;
      if(mob.state==="walk"||mob.state==="flee"){
        const dx=mob.target.x-mob.root.position.x,dz=mob.target.z-mob.root.position.z,distance=Math.hypot(dx,dz);
        if(distance<.22){mob.state="idle";mob.timer=1.5;updateLegInstances(mob,false,0);}
        else{
          const speed=mob.speed*(mob.state==="flee"?2.8:1),step=Math.min(distance,speed*dt);
          const nx=mob.root.position.x+dx/distance*step,nz=mob.root.position.z+dz/distance*step;
          const gx=Math.round(nx),gz=Math.round(nz),ground=this.world.highest(gx,gz);
          if(this.world.isSolid(gx,ground+1,gz)||this.world.isSolid(gx,ground+2,gz)){mob.state="idle";mob.timer=.8;}
          else{mob.root.position.x=nx;mob.root.position.z=nz;mob.root.rotation.y=Math.atan2(dx,dz);mob.root.position.y=ground+.5;walking=true;}
        }
      }
      const swing=walking?Math.sin(time*7+mob.phase)*.48:Math.sin(time*1.5+mob.phase)*.035;
      updateLegInstances(mob,walking,swing);
      mob.bodyGroup.position.y=(mob.type==="chicken"?.48:.78)+(walking?Math.abs(Math.sin(time*7+mob.phase))*.025:0);
      mob.headPivot.rotation.x=(mob.state==="idle"&&mob.type==="sheep"&&Math.sin(time*.7+mob.phase)>.65)?.18:Math.sin(time*1.1+mob.phase)*.025;
    }
  }
  dispose(){
    for(const mob of this.mobs){this.scene.remove(mob.root);mob.staticGeometries.forEach(geometry=>geometry.dispose());mob.atlas.dispose();}
    this.mobs.length=0;
  }
}
