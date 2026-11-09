import * as THREE from "three";

const mix=(a,b,t)=>a+(b-a)*t;
const seeded=(n)=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)};

function material(color,roughness=.92){
  return new THREE.MeshLambertMaterial({color,flatShading:true});
}
function creatureAtlas(type){
  const canvas=document.createElement("canvas");canvas.width=64;canvas.height=32;
  const ctx=canvas.getContext("2d",{alpha:false});
  const palettes={
    sheep:{body:"#e8e6db",head:"#c7ad96",legs:"#5b5047",accent:"#f4f1e8",shade:"#c7c5bc"},
    cow:{body:"#eee9df",head:"#d7b99e",legs:"#554942",accent:"#51443e",shade:"#b87865"},
    chicken:{body:"#f1eee5",head:"#eee9db",legs:"#d4a632",accent:"#c94b48",shade:"#d7d3c9"}
  };
  const p=palettes[type];
  const regions=[
    [0,0,32,16,p.body,p.shade],
    [32,0,16,16,p.head,p.shade],
    [48,0,16,16,p.legs,p.shade],
    [0,16,16,16,p.accent,p.shade]
  ];
  ctx.fillStyle="#302d2a";ctx.fillRect(0,0,64,32);
  for(const [x,y,w,h,base,shade] of regions){
    ctx.fillStyle=base;ctx.fillRect(x,y,w,h);
    for(let py=y;py<y+h;py++)for(let px=x;px<x+w;px++){
      const n=((px*13+py*29+type.length*17)%19);
      if(n===0||n===7){ctx.fillStyle=shade;ctx.fillRect(px,py,1,1)}
    }
  }
  if(type==="cow"){
    ctx.fillStyle=p.accent;
    ctx.fillRect(4,3,8,5);ctx.fillRect(19,9,7,5);ctx.fillRect(27,1,4,4);
    ctx.fillRect(37,4,4,5);
  }else if(type==="sheep"){
    ctx.fillStyle="#faf8ef";
    for(let i=0;i<18;i++)ctx.fillRect((i*7)%32,(i*11)%16,1,1);
  }else{
    ctx.fillStyle="#c94b48";ctx.fillRect(35,1,7,4);ctx.fillRect(0,16,9,9);
    ctx.fillStyle="#f5c545";ctx.fillRect(10,21,5,3);
  }
  const texture=new THREE.CanvasTexture(canvas);
  texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;
  texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;
  const mat=new THREE.MeshLambertMaterial({map:texture,flatShading:true});
  mat.userData={textureWidth:64,textureHeight:32};
  return mat;
}
function cube(parent,mat,size,position,uvRect=[0,0,1,1]){
  const geometry=new THREE.BoxGeometry(size[0],size[1],size[2]);
  const uv=geometry.attributes.uv;
  for(let i=0;i<uv.count;i++){
    uv.setXY(i,uvRect[0]+uv.getX(i)*(uvRect[2]-uvRect[0]),uvRect[1]+uv.getY(i)*(uvRect[3]-uvRect[1]));
  }
  uv.needsUpdate=true;
  const mesh=new THREE.Mesh(geometry,mat);
  mesh.position.set(position[0],position[1],position[2]);mesh.castShadow=false;mesh.receiveShadow=false;
  parent.add(mesh);return mesh;
}

export class MobSystem{
  constructor(scene,world,seed=1){
    this.scene=scene;this.world=world;this.seed=seed;this.mobs=[];this.clock=0;
    this.spawn();
  }
  spawn(){
    const types=["sheep","sheep","cow","chicken","sheep","cow","chicken"];
    let placed=0;
    for(let i=0;i<types.length&&placed<types.length;i++){
      const x=Math.round((seeded(this.seed+i*7)-.5)*30);
      const z=Math.round((seeded(this.seed+i*13+4)-.5)*30);
      const y=this.world.highest(x,z);
      const surface=this.world.get(x,y,z);
      if(!surface||!["grass","sand"].includes(surface)||this.world.get(x,y+1,z))continue;
      const mob=this.create(types[i],x,y+.5,z,i);
      this.mobs.push(mob);this.scene.add(mob.root);placed++;
    }
    if(this.mobs.length<3){
      for(let i=0;i<5;i++){
        const x=6+i*2,z=5+(i%2)*3,y=this.world.highest(x,z);
        if(["grass","sand"].includes(this.world.get(x,y,z))&&!this.world.get(x,y+1,z)){
          const mob=this.create(i%2?"sheep":"chicken",x,y+.5,z,i+20);
          this.mobs.push(mob);this.scene.add(mob.root);
        }
      }
    }
  }
  create(type,x,y,z,index){
    const root=new THREE.Group();root.position.set(x,y,z);
    const atlas=creatureAtlas(type);
    const palette={body:atlas,head:atlas,leg:atlas,accent:atlas};
    const scale=type==="chicken"?.62:1;
    const bodyGroup=new THREE.Group();bodyGroup.position.y=.78*scale;root.add(bodyGroup);
    cube(bodyGroup,palette.body,[.88*scale,.7*scale,1.15*scale],[0,0,0],[0,0,.5,.5]);
    if(type==="sheep"){
      for(let dx of [-.34,0,.34])for(let dz of [-.35,.2]){
        if(dx===0&&dz===.2)continue;
        cube(bodyGroup,palette.accent,[.38,.39,.39],[dx,.05,dz],[0,.5,.25,1]);
      }
    }
    if(type==="cow"){
      cube(bodyGroup,palette.accent,[.16,.22,.04],[-.22,.12,.59]);
      cube(bodyGroup,palette.accent,[.2,.18,.04],[.25,-.08,-.59]);
      cube(bodyGroup,palette.accent,[.12,.18,.04],[-.2,-.2,-.35]);
    }
    const headPivot=new THREE.Group();headPivot.position.set(0,.22*scale,.72*scale);bodyGroup.add(headPivot);
    cube(headPivot,palette.head,[.42*scale,.42*scale,.42*scale],[0,0,.08*scale],[.5,0,.75,.5]);
    if(type==="cow"){
      cube(headPivot,palette.accent,[.12,.12,.14],[-.23,.25,.05]);
      cube(headPivot,palette.accent,[.12,.12,.14],[.23,.25,.05]);
      cube(headPivot,material(0x352c29),[.25,.16,.12],[0,-.1,.31]);
      cube(headPivot,material(0xf1eee4),[.08,.07,.08],[-.11,.22,.27]);
      cube(headPivot,material(0xf1eee4),[.08,.07,.08],[.11,.22,.27]);
    }else if(type==="sheep"){
      cube(headPivot,material(0x272727),[.07,.07,.04],[-.12,.05,.3]);
      cube(headPivot,material(0x272727),[.07,.07,.04],[.12,.05,.3]);
    }else{
      cube(headPivot,palette.accent,[.08,.19,.09],[0,.28,.02]);
      cube(headPivot,material(0xe5b338),[.2,.12,.22],[0,-.06,.27]);
      cube(headPivot,material(0x272727),[.04,.04,.03],[-.1,.03,.25]);
      cube(headPivot,material(0x272727),[.04,.04,.03],[.1,.03,.25]);
    }
    const legs=[];
    const legMaterial=palette.leg;
    const positions=[[-.25,-.3], [.25,-.3],[-.25,.32],[.25,.32]];
    for(let i=0;i<4;i++){
      const pivot=new THREE.Group();pivot.position.set(positions[i][0]*scale,.48*scale,positions[i][1]*scale);root.add(pivot);
      cube(pivot,legMaterial,[.2*scale,.58*scale,.2*scale],[0,-.23*scale,0],[.75,0,1,.5]);legs.push(pivot);
    }
    if(type==="cow"||type==="sheep"){
      const tail=cube(root,legMaterial,[.09,.42,.09],[0,.88*scale,-.67*scale]);tail.rotation.x=-.35;
    }
    return {
      type,root,bodyGroup,headPivot,legs,index,
      phase:seeded(index+this.seed)*Math.PI*2,
      state:"idle",timer:1+seeded(index+9)*3,
      target:new THREE.Vector3(x,y,z),origin:new THREE.Vector3(x,y,z),
      speed:type==="chicken"?1.05:.72
    };
  }
  update(dt,time){
    this.clock=time;
    for(const mob of this.mobs){
      mob.timer-=dt;
      if(mob.timer<=0){
        if(mob.state==="walk"){mob.state="idle";mob.timer=1.3+seeded(mob.index+Math.floor(time))*2.4}
        else{
          const angle=seeded(mob.index+Math.floor(time*2)+this.seed)*Math.PI*2;
          const distance=2+seeded(mob.index+Math.floor(time*3))*4;
          mob.target.set(
            mob.origin.x+Math.cos(angle)*distance,
            0,
            mob.origin.z+Math.sin(angle)*distance
          );
          mob.state="walk";mob.timer=3.5;
        }
      }
      let walking=false;
      if(mob.state==="walk"){
        const dx=mob.target.x-mob.root.position.x,dz=mob.target.z-mob.root.position.z;
        const distance=Math.hypot(dx,dz);
        if(distance<.22){mob.state="idle";mob.timer=1.5;mob.legs.forEach(leg=>leg.rotation.x=0)}
        else{
          const step=Math.min(distance,mob.speed*dt);
          mob.root.position.x+=dx/distance*step;mob.root.position.z+=dz/distance*step;
          mob.root.rotation.y=Math.atan2(dx,dz);walking=true;
          const groundX=Math.round(mob.root.position.x),groundZ=Math.round(mob.root.position.z);
          mob.root.position.y=this.world.highest(groundX,groundZ)+.5;
        }
      }
      const swing=walking?Math.sin(time*7+mob.phase)*.48:Math.sin(time*1.5+mob.phase)*.035;
      mob.legs.forEach((leg,index)=>{leg.rotation.x=walking?swing*(index%2===0?1:-1):swing*.12});
      mob.bodyGroup.position.y=(mob.type==="chicken"?.48:.78)+(walking?Math.abs(Math.sin(time*7+mob.phase))*.025:0);
      mob.headPivot.rotation.x=(mob.state==="idle"&&mob.type==="sheep"&&Math.sin(time*.7+mob.phase)>.65)?0.18:Math.sin(time*1.1+mob.phase)*.025;
    }
  }
  dispose(){
    for(const mob of this.mobs){
      this.scene.remove(mob.root);
      mob.root.traverse(object=>{
        if(object.isMesh){object.geometry.dispose();if(object.material)object.material.dispose()}
      });
    }
    this.mobs.length=0;
  }
}
