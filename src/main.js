import * as THREE from "three";
import {BLOCKS,BLOCK_MAP,ITEMS,ITEM_MAP,RECIPES,clamp} from "./data.js";
import {VoxelWorld} from "./world.js";
import {MobSystem} from "./mobs.js";
import {FirstPersonPhysics} from "./physics.js";
import {Inventory} from "./inventory.js";
import {saveGame,loadGame,deleteSave} from "./storage.js";

const $=id=>document.getElementById(id);
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x8bc7e7);
scene.fog=new THREE.Fog(0x8bc7e7,38,82);
const camera=new THREE.PerspectiveCamera(76,innerWidth/innerHeight,.1,140);
scene.add(camera);
const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:"high-performance"});
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;document.body.appendChild(renderer.domElement);
const armRig=new THREE.Group();armRig.position.set(.43,-.48,-.78);camera.add(armRig);
const sleeve=new THREE.Mesh(new THREE.BoxGeometry(.27,.42,.28),new THREE.MeshLambertMaterial({color:0x527d91}));
const hand=new THREE.Mesh(new THREE.BoxGeometry(.25,.25,.27),new THREE.MeshLambertMaterial({color:0xc99b78}));
sleeve.position.y=-.1;hand.position.set(0,-.34,.015);armRig.add(sleeve,hand);armRig.visible=false;
const skyLight=new THREE.HemisphereLight(0xd9efff,0x66704c,1.7);scene.add(skyLight);
const sun=new THREE.DirectionalLight(0xffefca,2.1);sun.position.set(-28,42,18);scene.add(sun);
let world=new VoxelWorld(scene,20261109),inventory=new Inventory("survival");
let mobs=new MobSystem(scene,world,world.seed);
camera.position.set(31,13,31);camera.lookAt(0,4,0);
let mode="survival",started=false,locked=false,uiOpen=false,dayTime=.25,weather="clear",health=20,hunger=20,selectedTab="items";
let yaw=0,pitch=0,velocity=new THREE.Vector3();
const physics=new FirstPersonPhysics();
const keys={},ray=new THREE.Raycaster();ray.far=6;
let leftDown=false,miningKey="",miningProgress=0,lastSave=0,lastHunger=0,toastTimer=0;
let targetHit=null,targetMob=null,toastTimerId=0;
const rainCount=360,rainPositions=new Float32Array(rainCount*3);
for(let i=0;i<rainCount;i++){rainPositions[i*3]=(Math.random()-.5)*42;rainPositions[i*3+1]=Math.random()*24;rainPositions[i*3+2]=(Math.random()-.5)*42}
const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute("position",new THREE.BufferAttribute(rainPositions,3));
const rain=new THREE.Points(rainGeo,new THREE.PointsMaterial({color:0xc9dceb,size:.09,transparent:true,opacity:.56}));rain.visible=false;scene.add(rain);

function notify(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimerId);toastTimerId=setTimeout(()=>el.classList.remove("show"),2100)}
function setOverlay(id,show){$(id).style.display=show?"flex":"none";uiOpen=show||["inventory-overlay","command-overlay","pause-overlay"].some(other=>$(other).style.display==="flex");if(show&&document.pointerLockElement)document.exitPointerLock()}
function requestLock(){if(started&&!uiOpen)renderer.domElement.requestPointerLock()}
function itemColor(id){const d=ITEM_MAP[id]||BLOCK_MAP[id];return d?.color??0xffffff}
function itemIcon(id){
 const canvas=document.createElement("canvas");canvas.width=16;canvas.height=16;
 const ctx=canvas.getContext("2d"),def=ITEM_MAP[id]||BLOCK_MAP[id];
 const base=itemColor(id),hex=n=>"#"+n.toString(16).padStart(6,"0");
 const shade=(n,f)=>{const c=new THREE.Color(n);c.multiplyScalar(f);return c.getHex()};
 const px=(x,y,color,w=1,h=1)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h)};
 const color=hex(base),dark=hex(shade(base,.55)),light=hex(shade(base,1.35));
 const rand=(x,y)=>{let n=(x*374761393+y*668265263+base)|0;n=(n^(n>>>13))*1274126177;return ((n^(n>>>16))>>>0)/4294967295};
 if(def?.kind==="tool"||id==="stick"){
  for(let i=0;i<10;i++)px(3+i,13-i,"#80532f",2,2);
  if(id.includes("pickaxe")){
   for(let i=0;i<10;i++)px(5+i,4+(i>4?i-4:0),"#b8c1c8",2,2);
   px(5,3,"#e0e5e7",4,2);px(12,6,"#7f8a91",3,2);
  }else if(id.includes("axe")){
   px(8,2,"#c8d0d5",4,2);px(6,3,"#dce2e5",6,2);px(5,5,"#8a969e",4,3);
  }else if(id.includes("shovel")){
   px(10,1,"#c8d1d6",3,3);px(9,3,"#aebac1",4,3);
  }else if(id.includes("sword")){
   for(let i=0;i<10;i++)px(3+i,3+(9-i),"#dce6ec",2,2);
   px(4,10,"#9caab2",5,2);px(3,12,"#7d4b2c",3,3);
  }
 }else if(def?.kind==="food"){
  if(id.includes("apple")){
   px(4,4,"#b62e31",8,8);px(3,6,"#d84443",10,6);px(6,2,"#80502d",2,3);px(8,1,"#65a64e",4,2);px(5,6,"#ff8a75",2,2);
  }else if(id.includes("bread")){
   px(3,5,"#9a642e",10,7);px(4,3,"#e8b85f",8,9);px(6,4,"#f6d88a",5,2);px(5,8,"#c58b42",2,2);
  }else{
   px(3,4,color,10,8);px(4,3,light,7,2);px(5,9,dark,6,2);px(6,6,"#edb19a",3,2);
  }
 }else if(id==="stick"||id==="coal"||id==="raw_iron"||id==="raw_gold"||id==="iron_ingot"||id==="gold_ingot"||id==="diamond"||id==="wool"){
  if(id==="coal"){px(4,5,"#17191c",8,7);px(5,4,"#45484a",5,2)}
  else if(id.includes("ingot")){px(3,6,color,10,5);px(4,5,light,8,2);px(4,11,dark,8,2)}
  else if(id==="diamond"){px(6,2,"#a8fff1",4,2);px(4,4,"#4edacb",8,4);px(5,8,"#27aeb0",6,4);px(7,12,"#197a89",3,2)}
  else if(id==="wool"){px(3,4,color,10,8);px(5,2,light,6,3);px(2,7,light,2,4);px(6,11,dark,6,2)}
  else{px(4,4,color,8,8);px(5,3,light,5,2);px(5,9,dark,7,2)}
 }else{
  px(1,1,dark,14,14);px(2,2,color,12,12);
  for(let y=2;y<14;y++)for(let x=2;x<14;x++)if(rand(x,y)>.78)px(x,y,light);
  if(id==="grass"){px(2,2,"#65a83f",12,4);for(let x=3;x<14;x+=3)px(x,1,"#8acb58",1,2);px(2,6,"#89613e",12,8)}
  if(id==="oak_log"){px(5,2,"#613f27",2,12);px(10,2,"#754a2c",1,12);px(3,4,"#d0a36b",2,1)}
  if(id==="leaves"){for(let i=0;i<28;i++)px(2+Math.floor(rand(i,1)*12),2+Math.floor(rand(i,2)*12),i%3?"#4b8a3d":"#79b94f")}
  if(id.endsWith("_ore")){const ore=hex(BLOCK_MAP[id]?.accent||0xffffff);for(let i=0;i<8;i++)px(2+Math.floor(rand(i,3)*12),2+Math.floor(rand(i,4)*12),ore,2,1)}
  if(id==="sand"){for(let i=0;i<18;i++)px(2+Math.floor(rand(i,5)*12),2+Math.floor(rand(i,6)*12),"#f0d99f")}
  if(id==="water"){for(let y=3;y<14;y+=4)px(2,y,"#6fb9e7",12,1)}
  if(id==="glass"){ctx.clearRect(0,0,16,16);px(2,2,"#9de6ef",12,1);px(2,13,"#9de6ef",12,1);px(2,2,"#9de6ef",1,12);px(13,2,"#9de6ef",1,12);px(4,4,"#d6fbff",2,1)}
  if(id==="torch"){ctx.clearRect(0,0,16,16);px(7,6,"#f6c54f",3,4);px(8,9,"#a96c34",2,6);px(6,3,"#ffef9a",5,3)}
  if(id==="crafting_table"){px(2,2,"#7d4f2e",12,4);px(3,3,"#deb16d",4,2);px(9,3,"#deb16d",4,2);px(3,8,"#8d5a32",10,5);px(4,9,"#d39a55",2,2)}
  if(id==="furnace"){px(4,4,"#24282c",8,8);px(5,5,"#c4c7c5",6,2);px(6,9,"#ef9a42",4,2)}
  if(id==="chest"){px(2,4,"#8d5a2d",12,9);px(2,4,"#d8a454",12,3);px(7,7,"#e3c15e",3,3);px(8,8,"#75502f",1,2)}
 }
 return '<img class="item-icon" alt="" src="'+canvas.toDataURL("image/png")+'">';
}
function renderHotbar(){
 const el=$("hotbar");el.innerHTML="";
 for(let i=0;i<9;i++){const s=inventory.slots[i],div=document.createElement("div");div.className="slot"+(i===inventory.selected?" selected":"");div.innerHTML='<span class="key">'+(i+1)+'</span>'+(s?itemIcon(s.id):"")+(s&&s.count>1?'<span class="stack">'+(mode==="creative"?"∞":s.count)+'</span>':"");
  const def=s&&ITEM_MAP[s.id];if(s&&def?.kind==="tool"&&s.durability!==undefined)div.title=def.name+" · Durabilidad "+s.durability;
  div.onclick=()=>{inventory.selected=i;renderHotbar();renderInventory()};el.append(div)
 }
}
function setMode(next){mode=next;inventory.setMode(next);$("mode-label").textContent=next==="creative"?"CREATIVO":"SUPERVIVENCIA";$("vitals").style.display=next==="creative"?"none":"flex";renderHotbar();notify("Modo de juego: "+(next==="creative"?"Creativo":"Supervivencia"))}
function showLoading(title){
 const screen=$("loading-screen");screen.style.display="flex";
 $("loading-title").textContent=title||"Preparando tu mundo";
 $("loading-detail").textContent="Inicializando recursos...";
 $("loading-fill").style.width="2%";$("loading-percent").textContent="2%";
}
function updateLoading(progress,detail){
 const value=Math.max(0,Math.min(100,Math.round(progress)));
 $("loading-fill").style.width=value+"%";$("loading-percent").textContent=value+"%";
 $("loading-detail").textContent=detail||"Cargando...";
}
async function replaceWorld(seed,changes=[]){
 showLoading("Generando un nuevo mundo");
 if(mobs)mobs.dispose();
 scene.remove(world.group);
 world=new VoxelWorld(scene,seed,{defer:true});
 await world.generateAsync(updateLoading);
 if(changes.length)world.importChanges(changes);
 mobs=new MobSystem(scene,world,seed);
 updateLoading(100,"Mundo listo");
 await new Promise(resolve=>setTimeout(resolve,220));
 $("loading-screen").style.display="none";
}
async function newWorld(nextMode){
 started=false;leftDown=false;miningProgress=0;
 physics.reset();velocity.set(0,0,0);
 const seed=Math.floor(100000+Math.random()*900000000);
 await replaceWorld(seed);
 inventory=new Inventory(nextMode);setMode(nextMode);
 if(nextMode==="creative"){ITEMS.slice(0,36).forEach((it,i)=>inventory.slots[i]={id:it.id,count:it.kind==="tool"?1:64,...(it.kind==="tool"?{durability:it.durability}:{})})}
 else{inventory.add("apple",2);inventory.add("bread",3)}
 const h=world.highest(0,0);camera.position.set(0,h+2.12,0);camera.rotation.set(0,0,0);yaw=0;pitch=0;
 velocity.set(0,0,0);physics.reset();physics.onGround=true;health=20;hunger=20;dayTime=.25;weather="clear";started=true;
 $("start-screen").style.display="none";$("hud").classList.remove("menu-hidden");setOverlay("pause-overlay",false);renderHotbar();renderInventory();updateSky();notify("Mundo creado · Semilla "+world.seed);save();
}
async function loadIntoGame(data){
 if(!data){notify("No se encontró una partida guardada.");return}
 started=false;
 await replaceWorld(Number(data.seed)||20261109,data.changes||[]);
 inventory=new Inventory(data.mode||"survival");inventory.restore(data.inventory||[]);inventory.selected=clamp(data.selected||0,0,8);
 physics.reset();velocity.set(0,0,0);
 setMode(data.mode==="creative"?"creative":"survival");
 if(Array.isArray(data.position)&&data.position.length===3)camera.position.set(...data.position);else camera.position.set(0,world.highest(0,0)+2.12,0);
 camera.rotation.set(0,0,0);yaw=0;pitch=0;
 dayTime=Number(data.dayTime)||.25;weather=data.weather||"clear";health=data.health??20;hunger=data.hunger??20;
 started=true;$("start-screen").style.display="none";$("hud").classList.remove("menu-hidden");setOverlay("pause-overlay",false);renderHotbar();renderInventory();updateSky();notify("Partida cargada correctamente.");requestLock();
}
function save(){
 if(!started)return;
 const ok=saveGame({seed:world.seed,changes:world.exportChanges(),inventory:inventory.serialize(),selected:inventory.selected,mode,position:camera.position.toArray(),dayTime,weather,health,hunger});
 if(ok)notify("Mundo guardado en este navegador.");else notify("No se pudo guardar. Comprueba el almacenamiento del navegador.");
}
function currentTarget(){ray.setFromCamera(new THREE.Vector2(0,0),camera);const hits=ray.intersectObjects(world.group.children,false);return hits.length?hits[0]:null}
function updateAim(){
 ray.setFromCamera(new THREE.Vector2(0,0),camera);
 const blocks=ray.intersectObjects(world.group.children,false),blockHit=blocks.length?blocks[0]:null;
 const creature=mobs?.pick(ray);
 if(creature&&(!blockHit||creature.distance<blockHit.distance)){targetMob=creature.mob;targetHit=null}
 else{targetMob=null;targetHit=blockHit}
}
function hitMob(mob){
 if(!mob)return;
 const direction=new THREE.Vector3(mob.root.position.x-camera.position.x,0,mob.root.position.z-camera.position.z);
 const result=mobs.hit(mob,direction);if(!result)return;
 if(result.drop&&mode==="survival"){
  const rest=inventory.add(result.drop,1);
  if(rest)notify("Inventario lleno: no se recogió el objeto.");
  else notify("Criatura derrotada · "+(ITEM_MAP[result.drop]?.name||result.drop)+" recogido.");
 }else notify("Golpe acertado · "+(mob.type==="sheep"?"Oveja":mob.type==="cow"?"Vaca":"Gallina")+" · "+result.hp+"/"+(result.maxHp||0)+" de vida.");
 renderHotbar();renderInventory();
}
function heldItem(){return inventory.selectedStack?ITEM_MAP[inventory.selectedStack.id]:null}
function canPlaceAt(x,y,z){const id=world.get(x,y,z);if(id)return false;const p=camera.position;if(Math.abs(p.x-x)<.8&&Math.abs(p.z-z)<.8&&p.y-1.62<y+.9&&p.y+.15>y-.5)return false;return true}
function useSelected(){
 const stack=inventory.selectedStack;if(!stack)return;
 const def=ITEM_MAP[stack.id];
 if(def?.food){if(mode==="survival"&&hunger>=20){notify("No tienes hambre.");return}if(mode!=="creative")inventory.consumeSelected();hunger=clamp(hunger+def.food*2,0,20);renderHotbar();updateVitals();notify("Has comido "+def.name+".");return}
 const block=BLOCK_MAP[stack.id];if(!block)return;
 const hit=targetHit||currentTarget();if(!hit)return;
 const b=world.resolveHit(hit);if(!b)return;
 const normal=hit.face.normal.clone().transformDirection(hit.object.matrixWorld);const x=b.x+Math.round(normal.x),y=b.y+Math.round(normal.y),z=b.z+Math.round(normal.z);
 if(!canPlaceAt(x,y,z))return;
 if(mode==="survival"&&!inventory.count(stack.id))return;
 world.set(x,y,z,stack.id);if(mode==="survival")inventory.consumeSelected();renderHotbar();
}
function breakBlock(b){
 const def=BLOCK_MAP[b.id];if(!def||def.hardness<0)return;
 world.set(b.x,b.y,b.z,null);
 if(mode==="survival"&&def.drop){const held=heldItem(),hasTool=held?.tool===def.tool;const needsTool=!!def.tool;const harvest=!needsTool||hasTool;
  if(harvest){const rest=inventory.add(def.drop,1);if(rest)notify("Inventario lleno: no se recogió "+(ITEM_MAP[def.drop]?.name||def.drop));}
  if(hasTool)inventory.damageSelected(1);
 }
 renderHotbar();renderInventory();
}
function mineTarget(dt){
 const label=$("target-label");
 if(targetMob){
  const name=targetMob.type==="sheep"?"Oveja":targetMob.type==="cow"?"Vaca":"Gallina";
  label.textContent=name+" · "+targetMob.hp+"/"+targetMob.maxHp+" ♥";
  label.style.opacity="1";miningKey="";miningProgress=0;return;
 }
 const hit=targetHit,b=hit?world.resolveHit(hit):null;
 if(!b){label.style.opacity="0";miningKey="";miningProgress=0;return}
 const def=BLOCK_MAP[b.id];label.textContent=(def?.name||b.id)+(mode==="survival"?" · "+Math.round(miningProgress*100)+"%":"");label.style.opacity="1";
 if(!leftDown)return;
 const key=b.x+","+b.y+","+b.z;if(key!==miningKey){miningKey=key;miningProgress=0}
 if(mode==="creative"){breakBlock(b);miningProgress=0;miningKey="";return}
 if(!def||def.hardness<0)return;
 const held=heldItem(),correct=held?.tool===def.tool;
 let speed=correct?(1.5+(held.tier||1)*.8):.45;if(!def.tool)speed=1.5;
 miningProgress+=dt*speed/Math.max(.12,def.hardness*1.3);
 if(miningProgress>=1){breakBlock(b);miningProgress=0;miningKey=""}
}
function updateVitals(){const hearts=Math.round(health/2),food=Math.round(hunger/2);$("health").textContent="♥ ".repeat(hearts)+"♡ ".repeat(10-hearts);$("hunger").textContent="● ".repeat(food)+"○ ".repeat(10-food)}
function setTime(which){dayTime=which==="night"?.78:.25;updateSky()}
function updateSky(){
 const angle=dayTime*Math.PI*2,light=Math.max(.08,Math.sin(angle)*.9+.25);
 sun.position.set(Math.cos(angle)*40,Math.sin(angle)*50,18);sun.intensity=light*2.05;skyLight.intensity=.35+light*1.4;
 const sky=new THREE.Color().setHSL(.56,.48,.13+light*.43);scene.background=sky;scene.fog.color.copy(sky);
 const shownTime=(dayTime*24+6)%24,hour=Math.floor(shownTime),mins=Math.floor((shownTime-hour)*60);
 $("time-label").textContent="Día · "+String(hour).padStart(2,"0")+":"+String(mins).padStart(2,"0")+" · "+(weather==="rain"?"Lluvia":"Despejado");
}
function setWeather(value){weather=value==="rain"?"rain":"clear";rain.visible=weather==="rain";updateSky();notify(weather==="rain"?"Comenzó a llover.":"El clima está despejado.")}
function renderInventory(){
 const grid=$("inventory-grid");grid.innerHTML="";
 inventory.slots.forEach((s,i)=>{const el=document.createElement("div");el.className="inv-slot"+(i===inventory.selected?" selected":"");el.innerHTML='<span class="number">'+(i<9?i+1:"")+'</span>'+(s?itemIcon(s.id):"")+(s?'<span class="stack">'+(mode==="creative"?"∞":s.count)+'</span>':"");
  el.title=s?(ITEM_MAP[s.id]?.name||s.id)+" ×"+s.count:"Espacio vacío";
  el.onclick=()=>{if(i<9)inventory.selected=i;else if(inventory.slots[i]){const tmp=inventory.slots[inventory.selected];inventory.slots[inventory.selected]=inventory.slots[i];inventory.slots[i]=tmp}renderHotbar();renderInventory()};grid.append(el)});
 const s=inventory.selectedStack;$("selected-info").textContent=s?(ITEM_MAP[s.id]?.name||s.id)+" · Cantidad: "+s.count+(s.durability!==undefined?" · Durabilidad: "+s.durability:""):"La ranura seleccionada está vacía.";
}
function showTab(tab){
 selectedTab=tab;document.querySelectorAll("#inventory-tabs .tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
 $("inventory-items").classList.toggle("hidden",tab!=="items");$("inventory-crafting").classList.toggle("hidden",tab!=="crafting");$("inventory-catalog").classList.toggle("hidden",tab!=="catalog");
}
function openInventory(){renderInventory();renderCatalog();renderRecipes();setOverlay("inventory-overlay",true);showTab(selectedTab)}
function renderCatalog(){
 const q=$("catalog-search").value.toLowerCase(),el=$("catalog");el.innerHTML="";
 ITEMS.filter(it=>it.name.toLowerCase().includes(q)||it.id.includes(q)).forEach(it=>{
  const div=document.createElement("div");div.className="catalog-item";div.innerHTML=itemIcon(it.id)+"<span>"+it.name+"</span>";div.onclick=()=>{
   if(mode==="creative"){inventory.slots[inventory.selected]={id:it.id,count:it.kind==="tool"?1:64,...(it.kind==="tool"?{durability:it.durability}:{})};renderHotbar();renderInventory();notify(it.name+" añadido a la barra rápida.")}
   else notify("El catálogo es informativo en supervivencia. Usa recursos y recetas para conseguir objetos.");
  };el.append(div)
 })
}
function renderRecipes(){
 const el=$("recipe-list");el.innerHTML="";
 RECIPES.forEach(r=>{
  const row=document.createElement("div");row.className="recipe";
  const ingredients=Object.entries(r.in).map(([id,n])=>(ITEM_MAP[id]?.name||id)+" ×"+n).join(" + ");
  const btn=document.createElement("button");btn.className="btn small";btn.textContent="Fabricar";btn.disabled=mode==="survival"&&(!inventory.has(r.in)||(r.station==="table"&&!inventory.has({crafting_table:1})));btn.onclick=()=>{const result=inventory.craft(r.id);notify(result.message);renderHotbar();renderInventory();renderRecipes()};
  const left=document.createElement("div");left.innerHTML="<strong>"+r.name+"</strong><small>"+ingredients+(r.station==="table"?" · Requiere mesa":" · Inventario")+"</small>";row.append(left,btn);el.append(row)
 })
}
function openCommands(){setOverlay("command-overlay",true);$("command-input").focus()}
function commandOutput(message){const log=$("command-log"),line=document.createElement("div");line.textContent="› "+message;log.append(line);log.scrollTop=log.scrollHeight}
function give(id,n=1){
 if(!ITEM_MAP[id]){commandOutput("Objeto desconocido: "+id);return}
 if(mode==="creative"){const i=inventory.slots.findIndex(s=>s?.id===id);const slot=i>=0?i:inventory.slots.findIndex(s=>!s);if(slot>=0)inventory.slots[slot]={id,count:ITEM_MAP[id].kind==="tool"?1:n};}
 else inventory.add(id,n);
 renderHotbar();renderInventory();commandOutput("Entregado: "+n+" × "+ITEM_MAP[id].name);
}
function runCommand(raw){
 const args=raw.trim().replace(/^\//,"").split(/\s+/),cmd=(args.shift()||"").toLowerCase();
 switch(cmd){
 case"help":commandOutput("Comandos: /help · /gamemode creative|survival · /give <objeto> [cantidad] · /time set day|night · /weather clear|rain · /tp x y z · /setblock x y z bloque · /fill x1 y1 z1 x2 y2 z2 bloque · /clear · /save · /seed · /spawn");break;
 case"gamemode":if(["creative","survival"].includes(args[0])){setMode(args[0]);commandOutput("Modo cambiado a "+args[0])}else commandOutput("Uso: /gamemode creative o survival");break;
 case"give":give(args[0],clamp(Number(args[1])||1,1,999));break;
 case"time":if(args[0]==="set"&&["day","night"].includes(args[1])){setTime(args[1]);commandOutput("Hora actualizada.")}else commandOutput("Uso: /time set day|night");break;
 case"weather":setWeather(args[0]);commandOutput("Clima: "+weather);break;
 case"tp":if(args.length>=3&&args.slice(0,3).every(v=>Number.isFinite(Number(v)))){camera.position.set(Number(args[0]),Number(args[1]),Number(args[2]));velocity.set(0,0,0);commandOutput("Teletransporte realizado.")}else commandOutput("Uso: /tp x y z");break;
 case"setblock":if(args.length>=4){const [x,y,z]=args.slice(0,3).map(Number),id=args[3];if([x,y,z].every(Number.isFinite)&&BLOCK_MAP[id]){world.set(x,y,z,id);commandOutput("Bloque colocado.")}else commandOutput("Coordenadas o bloque inválidos.")}else commandOutput("Uso: /setblock x y z bloque");break;
 case"fill":if(args.length>=7){const v=args.slice(0,6).map(Number),id=args[6];if(v.every(Number.isFinite)&&BLOCK_MAP[id]){const min=v.slice(0,3).map(Math.floor),max=v.slice(3,6).map(Math.floor);let total=0;for(let x=Math.min(min[0],max[0]);x<=Math.max(min[0],max[0]);x++)for(let y=Math.min(min[1],max[1]);y<=Math.max(min[1],max[1]);y++)for(let z=Math.min(min[2],max[2]);z<=Math.max(min[2],max[2]);z++){if(total>=256)break;world.set(x,y,z,id,false);total++}world.rebuild();commandOutput("Bloques colocados: "+total+(total===256?" · límite de 256 por comando":""))}else commandOutput("Parámetros inválidos.")}else commandOutput("Uso: /fill x1 y1 z1 x2 y2 z2 bloque");break;
 case"clear":inventory.slots=Array.from({length:36},()=>null);renderHotbar();renderInventory();commandOutput("Inventario vaciado.");break;
 case"save":save();commandOutput("Guardado solicitado.");break;
 case"seed":commandOutput("Semilla: "+world.seed);break;
 case"spawn":camera.position.set(0,world.highest(0,0)+2.12,0);velocity.set(0,0,0);commandOutput("Volviste al punto de aparición.");break;
 default:commandOutput("Comando desconocido. Escribe /help.")
 }
}
function togglePause(){if(!started)return;setOverlay("pause-overlay",true)}
function hideOverlay(id){$(id).style.display="none";uiOpen=["inventory-overlay","command-overlay","pause-overlay"].some(other=>$(other).style.display==="flex")}
renderer.domElement.addEventListener("click",()=>{if(started&&!uiOpen&&!locked)requestLock()});
renderer.domElement.addEventListener("wheel",e=>{if(!locked)return;inventory.selected=(inventory.selected+(e.deltaY>0?1:8))%9;renderHotbar();renderInventory()},{passive:true});
renderer.domElement.addEventListener("mousedown",e=>{if(!locked)return;if(e.button===0){leftDown=true;miningProgress=0;miningKey="";if(targetMob)hitMob(targetMob)}if(e.button===2)e.preventDefault()});
renderer.domElement.addEventListener("mouseup",e=>{if(e.button===0)leftDown=false;if(e.button===2&&locked)useSelected()});
renderer.domElement.addEventListener("contextmenu",e=>e.preventDefault());
document.addEventListener("pointerlockchange",()=>{locked=document.pointerLockElement===renderer.domElement});
document.addEventListener("mousemove",e=>{if(!locked)return;yaw-=e.movementX*.0022;pitch-=e.movementY*.0022;pitch=clamp(pitch,-1.52,1.52);camera.rotation.order="YXZ";camera.rotation.y=yaw;camera.rotation.x=pitch});
document.addEventListener("keydown",e=>{
 keys[e.code]=true;
 if(e.code==="Escape"&&started){
  leftDown=false;
  if($("inventory-overlay").style.display==="flex")hideOverlay("inventory-overlay");
  else if($("command-overlay").style.display==="flex")hideOverlay("command-overlay");
  else if($("pause-overlay").style.display==="flex")hideOverlay("pause-overlay");
  else togglePause();
  return;
 }
 const typing=e.target instanceof HTMLElement&&(e.target.isContentEditable||["INPUT","TEXTAREA"].includes(e.target.tagName));
 if(typing)return;
 if(e.code==="KeyE"&&!e.repeat&&started){if($("inventory-overlay").style.display==="flex")hideOverlay("inventory-overlay");else openInventory()}
 if(e.code==="KeyT"&&!e.repeat&&started)openCommands();
 if(/^Digit[1-9]$/.test(e.code)){inventory.selected=Number(e.code.slice(5))-1;renderHotbar();renderInventory()}
 if(e.code==="Space"&&mode==="survival"&&started&&!e.repeat)physics.queueJump()
 if(e.code==="KeyF"&&!e.repeat&&started)save();
});
document.addEventListener("keyup",e=>{keys[e.code]=false});
$("start-survival").onclick=()=>newWorld("survival");$("start-creative").onclick=()=>newWorld("creative");
$("resume-save").onclick=()=>loadIntoGame(loadGame());
$("close-inventory").onclick=()=>hideOverlay("inventory-overlay");$("close-commands").onclick=()=>hideOverlay("command-overlay");
$("resume-game").onclick=()=>hideOverlay("pause-overlay");
$("save-game").onclick=()=>{save();hideOverlay("pause-overlay")};
$("open-inventory").onclick=()=>{hideOverlay("pause-overlay");openInventory()};
$("back-menu").onclick=()=>{save();started=false;hideOverlay("pause-overlay");$("hud").classList.add("menu-hidden");$("start-screen").style.display="flex"};
$("inventory-tabs").addEventListener("click",e=>{const btn=e.target.closest("[data-tab]");if(btn)showTab(btn.dataset.tab)});
$("catalog-search").addEventListener("input",renderCatalog);
$("command-input").addEventListener("keydown",e=>{if(e.key==="Enter"){const raw=e.target.value;e.target.value="";if(raw.trim())runCommand(raw)}});
window.addEventListener("beforeunload",()=>{if(started)saveGame({seed:world.seed,changes:world.exportChanges(),inventory:inventory.serialize(),selected:inventory.selected,mode,position:camera.position.toArray(),dayTime,weather,health,hunger})});
$("hud").classList.add("menu-hidden");
updateVitals();renderHotbar();renderInventory();renderRecipes();renderCatalog();
if(!loadGame())$("resume-save").disabled=true;

function tick(now){
 requestAnimationFrame(tick);const dt=Math.min((now-(tick.last||now))/1000,.05);tick.last=now;
 if(mobs)mobs.update(dt,now/1000);
 if(!started){const orbit=now*.000045;camera.position.set(Math.cos(orbit)*33,12+Math.sin(orbit*.7)*1.2,Math.sin(orbit)*33);camera.lookAt(0,4,0)}
 armRig.visible=started&&locked&&!uiOpen;
 if(armRig.visible){
  const moving=!!(keys.KeyW||keys.KeyA||keys.KeyS||keys.KeyD);
  const stride=moving?Math.sin(now*.009)*.14:Math.sin(now*.0017)*.012;
  armRig.rotation.x=leftDown?-.72+Math.sin(now*.018)*.06:stride;
  armRig.rotation.z=moving?Math.cos(now*.009)*.06:0;
 }
 if(started&&locked){
  const forward=(keys.KeyW?1:0)-(keys.KeyS?1:0),side=(keys.KeyD?1:0)-(keys.KeyA?1:0);
  const dir=new THREE.Vector3(side,0,-forward);if(dir.lengthSq()>1)dir.normalize();dir.applyAxisAngle(new THREE.Vector3(0,1,0),yaw);
  const speed=mode==="creative"?8.5:keys.ControlLeft?7:keys.ShiftLeft?2.2:4.8;
  if(mode==="creative"){
   camera.position.x+=dir.x*speed*dt;camera.position.z+=dir.z*speed*dt;
   if(keys.Space)camera.position.y+=speed*dt;if(keys.ShiftLeft)camera.position.y-=speed*dt;
   velocity.set(0,0,0);
  }else{
   physics.update(world,camera.position,velocity,{x:dir.x,z:dir.z,speed},dt);
   if(camera.position.y< -12){
    camera.position.set(0,world.highest(0,0)+2.12,0);velocity.set(0,0,0);physics.reset();physics.onGround=true;
    health=clamp(health-4,0,20);updateVitals();notify("Caída: has regresado al punto de aparición.");
   }
  }
  updateAim();mineTarget(dt);
  $("coords").textContent="X: "+camera.position.x.toFixed(1)+" · Y: "+camera.position.y.toFixed(1)+" · Z: "+camera.position.z.toFixed(1);
  if(mode==="survival"&&Date.now()-lastHunger>45000&&hunger>0){hunger=Math.max(0,hunger-1);lastHunger=Date.now();if(hunger===0)health=Math.max(1,health-1);updateVitals()}
  dayTime=(dayTime+dt/900)%1;updateSky();
  if(weather==="rain"){const p=rainGeo.attributes.position;for(let i=0;i<rainCount;i++){let y=p.array[i*3+1]-dt*18;if(y<camera.position.y-6)y=camera.position.y+12;p.array[i*3+1]=y;p.array[i*3]+=dir.x*dt*2;p.array[i*3+2]+=dir.z*dt*2}p.needsUpdate=true;rain.position.set(camera.position.x,0,camera.position.z)}
  if(now-lastSave>30000){saveGame({seed:world.seed,changes:world.exportChanges(),inventory:inventory.serialize(),selected:inventory.selected,mode,position:camera.position.toArray(),dayTime,weather,health,hunger});lastSave=now}
 }
 renderer.render(scene,camera);
}
requestAnimationFrame(tick);
window.addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6))});
