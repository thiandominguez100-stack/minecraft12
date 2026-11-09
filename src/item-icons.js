import * as THREE from "three";
import {BLOCK_MAP,ITEM_MAP} from "./data.js";
import {makeBlockTexture} from "./textures.js";
const SIZE=64,cache=new Map(),faceCache=new Map();
const cssColor=n=>"#"+Number(n>>>0).toString(16).padStart(6,"0");
const color=(n,f=1)=>cssColor(new THREE.Color(n).multiplyScalar(f).getHex());
const poly=(ctx,points,fill,stroke="#18202a",width=1)=>{ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}};
const rect=(ctx,x,y,w,h,fill)=>{ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);};
function getFace(def,face){const key=def.id+":"+face;if(!faceCache.has(key))faceCache.set(key,makeBlockTexture(def,face));return faceCache.get(key).image;}
function mappedQuad(ctx,image,p0,p1,p3){
 const p2=[p1[0]+p3[0]-p0[0],p1[1]+p3[1]-p0[1]];
 ctx.save();ctx.beginPath();ctx.moveTo(...p0);ctx.lineTo(...p1);ctx.lineTo(...p2);ctx.lineTo(...p3);ctx.closePath();ctx.clip();
 const a=(p1[0]-p0[0])/SIZE,b=(p1[1]-p0[1])/SIZE,c=(p3[0]-p0[0])/SIZE,d=(p3[1]-p0[1])/SIZE;
 ctx.setTransform(a,b,c,d,p0[0],p0[1]);ctx.drawImage(image,0,0,SIZE,SIZE);ctx.restore();
}
function cubeIcon(ctx,def){
 const top=[[32,4],[57,17],[32,30],[7,17]],left=[[7,17],[32,30],[32,58],[7,45]],right=[[32,30],[57,17],[57,45],[32,58]];
 poly(ctx,[[6,46],[32,61],[59,46],[32,33]],"#00000033",null);
 mappedQuad(ctx,getFace(def,"top"),top[0],top[1],top[3]);
 mappedQuad(ctx,getFace(def,"front"),left[0],left[1],left[3]);
 mappedQuad(ctx,getFace(def,"right"),right[0],right[1],right[3]);
 ctx.lineWidth=1.3;ctx.strokeStyle="#111923";
 for(const face of [top,left,right]){ctx.beginPath();ctx.moveTo(...face[0]);for(let i=1;i<face.length;i++)ctx.lineTo(...face[i]);ctx.closePath();ctx.stroke();}
}
function drawApple(ctx){
 poly(ctx,[[31,12],[39,9],[46,13],[52,22],[51,34],[46,45],[37,53],[27,53],[18,48],[12,39],[11,28],[16,18],[24,13]],"#b9272e","#5c171f",2);
 poly(ctx,[[18,20],[24,15],[32,17],[27,25],[19,29]],"#ed4b4b",null);poly(ctx,[[38,28],[46,22],[46,35],[40,43],[34,41]],"#8c1c29",null);
 rect(ctx,24,18,4,3,"#ff8880");rect(ctx,22,22,3,4,"#f56c63");rect(ctx,30,8,4,10,"#65402a");
 poly(ctx,[[31,10],[39,4],[48,5],[43,12],[35,14]],"#4f9b43","#28552f",1);rect(ctx,39,6,5,2,"#a9d96e");
}
function drawBread(ctx){
 poly(ctx,[[10,30],[13,19],[23,12],[41,10],[52,18],[55,31],[50,43],[39,50],[20,49],[11,41]],"#b87936","#6b4224",2);
 poly(ctx,[[13,26],[20,17],[37,13],[49,19],[52,29],[44,37],[25,39],[14,34]],"#e8b65f","#ad7135",1);
 poly(ctx,[[20,21],[29,16],[40,17],[46,22],[35,23],[26,27]],"#ffe09a",null);
 rect(ctx,20,31,7,3,"#ce9145");rect(ctx,39,29,8,3,"#c9873c");rect(ctx,28,38,11,3,"#d89b4b");
}
function drawMeat(ctx,id){
 const chicken=id==="raw_chicken",base=chicken?"#d9a07f":id==="raw_mutton"?"#c66c68":"#9d4144";
 poly(ctx,[[11,22],[20,14],[34,13],[47,20],[52,31],[44,43],[30,49],[16,42],[10,32]],base,"#612f36",2);
 poly(ctx,[[16,22],[25,16],[37,19],[29,26],[18,29]],chicken?"#f1c4a0":"#eb8b85",null);
 poly(ctx,[[32,32],[42,26],[47,34],[39,42],[30,41]],chicken?"#c98267":"#87333a",null);
 rect(ctx,18,33,7,4,"#f4c2a8");rect(ctx,35,19,5,3,"#f1b1a2");
}
function drawIngot(ctx,id,def){
 poly(ctx,[[10,29],[20,16],[43,13],[55,25],[50,43],[20,48],[8,39]],color(def.color,.55),"#353b40",2);
 poly(ctx,[[12,28],[22,19],[42,16],[50,25],[44,37],[20,42],[11,36]],color(def.color,1.12),null);
 poly(ctx,[[22,20],[42,17],[48,24],[27,27],[15,32]],id==="gold_ingot"?"#f4d66b":"#e8eff1",null);
 rect(ctx,22,31,17,3,color(def.color,.78));rect(ctx,17,35,7,2,color(def.color,1.3));
}
function drawDiamond(ctx){poly(ctx,[[10,23],[20,10],[44,10],[55,24],[33,54]],"#167c87","#10434d",2);poly(ctx,[[12,23],[22,13],[42,13],[51,24],[33,47]],"#39d6cd",null);poly(ctx,[[22,13],[32,21],[15,23]],"#b4fff5",null);poly(ctx,[[32,21],[51,24],[33,47]],"#24aeb7",null);poly(ctx,[[15,24],[32,22],[33,46]],"#52eee0",null);}
function drawCoal(ctx){poly(ctx,[[10,37],[12,23],[22,13],[34,17],[39,10],[51,19],[55,34],[45,47],[22,51]],"#24282c","#0d1115",2);poly(ctx,[[13,29],[23,17],[33,21],[26,34],[16,37]],"#555c60",null);poly(ctx,[[34,19],[46,18],[51,31],[40,36]],"#343a3f",null);rect(ctx,22,38,9,3,"#11161b");rect(ctx,38,30,7,3,"#10151a");}
function drawWool(ctx){const blobs=[[17,27,13,15],[25,15,16,19],[38,20,15,18],[43,33,10,12],[27,38,18,12],[13,35,9,10]];for(let i=0;i<blobs.length;i++){const [x,y,w,h]=blobs[i];ctx.beginPath();ctx.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);ctx.fillStyle=i%2?"#eeeae0":"#d8d7d1";ctx.fill();ctx.strokeStyle="#888b8b";ctx.lineWidth=1;ctx.stroke();}rect(ctx,25,17,9,4,"#fffdf5");rect(ctx,16,31,5,5,"#fffdf5");}
function drawStick(ctx){poly(ctx,[[16,51],[13,48],[43,11],[48,14],[20,53]],"#81532f","#432b1d",1);poly(ctx,[[18,47],[43,14],[45,15],[20,50]],"#bd8951",null);rect(ctx,40,12,5,3,"#d8ac6c");}
function drawTool(ctx,id){
 const wood="#87562e",woodLight="#c18a4e",metal=id.includes("wooden")?"#c18a4e":id.includes("stone")?"#969fa2":id.includes("iron")?"#d5dcdf":"#c6cdd0";
 if(id.includes("pickaxe")){poly(ctx,[[14,51],[11,47],[39,13],[43,16],[17,55]],wood,"#40291b",2);poly(ctx,[[17,47],[40,14],[42,16],[19,50]],woodLight,null);poly(ctx,[[8,17],[12,9],[25,7],[34,11],[43,8],[55,13],[54,20],[42,19],[34,17],[25,20],[11,23]],metal,"#303b43",2);poly(ctx,[[11,16],[16,11],[28,11],[38,13],[51,12],[49,16],[36,16],[25,15],[14,19]],"#eef3f4",null);}
 else if(id.includes("axe")){poly(ctx,[[17,51],[13,47],[39,12],[44,16],[21,55]],wood,"#40291b",2);poly(ctx,[[20,47],[41,14],[43,16],[22,50]],woodLight,null);poly(ctx,[[28,13],[35,5],[51,8],[58,17],[53,31],[42,33],[33,25]],metal,"#303b43",2);poly(ctx,[[37,10],[49,10],[53,17],[44,16],[35,21]],"#edf2f3",null);}
 else if(id.includes("shovel")){poly(ctx,[[24,53],[20,50],[34,12],[39,14],[27,54]],wood,"#40291b",2);poly(ctx,[[27,47],[37,15],[39,16],[29,48]],woodLight,null);poly(ctx,[[27,8],[39,4],[47,9],[45,22],[36,28],[28,21]],metal,"#303b43",2);poly(ctx,[[31,10],[39,7],[43,11],[38,18],[31,18]],"#eff4f3",null);}
 else if(id.includes("sword")){poly(ctx,[[17,48],[13,44],[44,9],[49,13],[21,53]],metal,"#364047",2);poly(ctx,[[39,13],[45,9],[48,13],[21,43],[18,40]],"#f0f4f4",null);poly(ctx,[[12,39],[28,53],[24,57],[8,43]],"#8e5b34","#422c1d",2);poly(ctx,[[14,37],[31,50],[28,54],[11,40]],"#d3a064",null);poly(ctx,[[13,33],[33,48],[30,53],[10,38]],"#c2cbd0","#343a40",2);}
}
function drawTorch(ctx){poly(ctx,[[27,28],[35,28],[38,58],[30,59]],"#80512d","#3f281a",2);rect(ctx,30,31,3,24,"#c28c4f");poly(ctx,[[23,26],[22,15],[29,7],[38,12],[41,25],[35,31]],"#e69b32","#75461f",2);poly(ctx,[[27,20],[28,11],[34,8],[37,18],[33,24]],"#fff0a0",null);rect(ctx,32,13,3,7,"#fffbd0");}
function drawItem(ctx,id,def){
 if(def?.kind==="tool")return drawTool(ctx,id);
 if(id==="apple")return drawApple(ctx);if(id==="bread")return drawBread(ctx);
 if(id==="raw_beef"||id==="raw_mutton"||id==="raw_chicken")return drawMeat(ctx,id);
 if(id==="coal")return drawCoal(ctx);if(id==="diamond")return drawDiamond(ctx);
 if(id==="wool")return drawWool(ctx);if(id==="stick")return drawStick(ctx);
 if(id==="iron_ingot"||id==="gold_ingot")return drawIngot(ctx,id,def);
 if(id==="raw_iron"||id==="raw_gold"){const base=id==="raw_gold"?"#d5a82e":"#9a7467";poly(ctx,[[12,37],[16,21],[27,13],[43,16],[52,29],[47,44],[31,52],[17,48]],base,"#46382f",2);rect(ctx,22,19,9,5,color(def.color,1.35));rect(ctx,35,28,8,5,color(def.color,.72));rect(ctx,19,38,8,4,color(def.color,.75));return;}
 if(id==="torch")return drawTorch(ctx);
 if(id==="water"){poly(ctx,[[5,34],[18,25],[32,32],[46,24],[59,31],[59,43],[45,50],[31,43],[17,50],[5,43]],"#3788ba","#174a6a",1);poly(ctx,[[9,33],[19,27],[31,34],[45,27],[55,32]],"#b7eaff",null);return;}
 if(id==="glass"){poly(ctx,[[9,17],[32,5],[55,17],[55,45],[32,59],[9,45]],"#72c6d4","#d7faff",2);rect(ctx,14,20,3,22,"#dfffff");rect(ctx,20,15,2,12,"#efffff");return;}
 drawApple(ctx);
}
export function renderItemIcon(id){
 if(cache.has(id))return cache.get(id);
 const canvas=document.createElement("canvas");canvas.width=SIZE;canvas.height=SIZE;
 const ctx=canvas.getContext("2d");ctx.imageSmoothingEnabled=false;
 const def=ITEM_MAP[id]||BLOCK_MAP[id];
 if(def&&BLOCK_MAP[id]&&id!=="torch"&&id!=="water")cubeIcon(ctx,BLOCK_MAP[id]);
 else drawItem(ctx,id,def);
 const data=canvas.toDataURL("image/png");cache.set(id,data);return data;
}