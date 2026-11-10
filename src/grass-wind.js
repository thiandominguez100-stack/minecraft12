import {hash} from "./terrain.js";

export const GRASS_BLADES_MIN=52;
export const GRASS_BLADES_MAX=76;

export function createGrassBladeBuffers(seed,entries){
 const tiles=[];
 for(const block of entries)if(block.id==="grass"&&block.y===0)tiles.push(block);
 let count=0;
 const tileCounts=new Uint8Array(tiles.length);
 for(let i=0;i<tiles.length;i++){
  const b=tiles[i],n=GRASS_BLADES_MIN+Math.floor(hash(b.x,b.z,seed+997)*(GRASS_BLADES_MAX-GRASS_BLADES_MIN+1));
  tileCounts[i]=n;count+=n;
 }
 const matrices=new Float32Array(count*16),colors=new Float32Array(count*3);
 const color={r:0,g:0,b:0,setHSL(h,s,l){
  const hue=((h%1)+1)%1,q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;
  const channel=t=>{if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};
  this.r=channel(hue+1/3);this.g=channel(hue);this.b=channel(hue-1/3);return this;
 }};
 let cursor=0;
 for(let tileIndex=0;tileIndex<tiles.length;tileIndex++){
  const {x,z}=tiles[tileIndex],n=tileCounts[tileIndex];
  for(let blade=0;blade<n;blade++){
   const k=blade+1,rx=hash(x+k*13,z-k*19,seed+101),rz=hash(x-k*23,z+k*11,seed+211);
   const angle=hash(x+k*7,z-k*31,seed+307)*Math.PI*2;
   const height=.38+hash(x+k*17,z+k*5,seed+401)*.66;
   const width=.62+hash(x-k*3,z+k*29,seed+503)*.95;
   const c=Math.cos(angle),s=Math.sin(angle),m=cursor*16,p=cursor*3;
   matrices[m]=c*width;matrices[m+1]=0;matrices[m+2]=-s*width;matrices[m+3]=0;
   matrices[m+4]=0;matrices[m+5]=height;matrices[m+6]=0;matrices[m+7]=0;
   matrices[m+8]=s*width;matrices[m+9]=0;matrices[m+10]=c*width;matrices[m+11]=0;
   matrices[m+12]=x+.025+rx*.95;matrices[m+13]=.505;matrices[m+14]=z+.025+rz*.95;matrices[m+15]=1;
   const hue=.275+hash(x+k*37,z-k*41,seed+601)*.055;
   const saturation=.48+hash(x-k*43,z+k*47,seed+701)*.2;
   const lightness=.29+hash(x+k*53,z+k*59,seed+809)*.17;
   color.setHSL(hue,saturation,lightness);
   colors[p]=color.r;colors[p+1]=color.g;colors[p+2]=color.b;
   cursor++;
  }
 }
 return {count,matrices,colors,tileCount:tiles.length,minPerTile:GRASS_BLADES_MIN,maxPerTile:GRASS_BLADES_MAX};
}

export function windStrengthForWeather(weather="clear",time=0){
 return (weather==="rain"?.60:.44)+.09*(.5+.5*Math.sin(time*.17+1.1));
}

export function patchGrassWindShader(shader,uniforms){
 if(!shader||typeof shader.vertexShader!=="string")throw new TypeError("Invalid grass shader");
 const common="#include <common>",begin="#include <begin_vertex>";
 if(!shader.vertexShader.includes(common))throw new Error("Grass shader is missing the common chunk");
 if(!shader.vertexShader.includes(begin))throw new Error("Grass shader is missing the begin_vertex chunk");
 shader.uniforms.uWindTime=uniforms.time;shader.uniforms.uWindStrength=uniforms.strength;
 shader.vertexShader=shader.vertexShader.replace(common,common+"\nuniform float uWindTime;\nuniform float uWindStrength;");
 shader.vertexShader=shader.vertexShader.replace(begin,begin+`
#ifdef USE_INSTANCING
 vec2 grassWorldXZ = instanceMatrix[3].xz;
 float bladeHeight = clamp(position.y / 0.82, 0.0, 1.0);
 float broadWave = sin(uWindTime * 0.78 + dot(grassWorldXZ, vec2(0.071, 0.049)));
 float crossingWave = sin(uWindTime * 1.63 + dot(grassWorldXZ, vec2(-0.127, 0.153)) + broadWave * 0.72);
 float fineFlutter = sin(uWindTime * 3.45 + dot(grassWorldXZ, vec2(0.29, 0.24)));
 float bend = bladeHeight * bladeHeight;
 transformed.x += (broadWave * 0.66 + crossingWave * 0.24 + fineFlutter * 0.10) * uWindStrength * bend;
 transformed.z += (cos(uWindTime * 0.69 + dot(grassWorldXZ, vec2(0.052, -0.074))) * 0.72 + crossingWave * 0.18) * uWindStrength * 0.46 * bend;
 transformed.x += fineFlutter * uWindStrength * 0.035 * bladeHeight;
#endif`);
 return shader;
}

export function createGrassBladeGeometry(THREE){
 const g=new THREE.BufferGeometry();
 g.setAttribute("position",new THREE.Float32BufferAttribute([
  -.010,0,0, .010,0,0,
  -.009,.28,.004, .009,.28,.004,
  -.004,.56,.015, .004,.56,.015,
  0,.82,.032
 ],3));
 g.setAttribute("color",new THREE.Float32BufferAttribute([
  .64,.78,.47, .64,.78,.47,
  .78,.91,.59, .78,.91,.59,
  .91,.99,.68, .91,.99,.68,
  .96,1,.75
 ],3));
 g.setIndex([0,1,2,1,3,2,2,3,4,3,5,4,4,5,6]);
 g.computeVertexNormals();g.computeBoundingSphere();return g;
}

export function createGrassBladeMaterial(THREE,uniforms){
 const m=new THREE.MeshLambertMaterial({color:0xffffff,vertexColors:true,side:THREE.DoubleSide,transparent:false,depthWrite:true});
 m.onBeforeCompile=s=>patchGrassWindShader(s,uniforms);
 m.customProgramCacheKey=()=>"blockworld-dense-grass-wind-v2";
 return m;
}
