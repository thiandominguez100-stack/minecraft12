export const CHUNK_SIZE=16,CHUNKS_X=8,CHUNKS_Z=8,TOTAL_CHUNKS=CHUNKS_X*CHUNKS_Z;
export const WORLD_MIN_X=-64,WORLD_MIN_Z=-64,WORLD_WIDTH=CHUNKS_X*CHUNK_SIZE,WORLD_DEPTH=CHUNKS_Z*CHUNK_SIZE;
export const WORLD_MAX_X=WORLD_MIN_X+WORLD_WIDTH-1,WORLD_MAX_Z=WORLD_MIN_Z+WORLD_DEPTH-1,WATER_LEVEL=5;
export const hash=(x,z,seed=0)=>{let n=(x*374761393+z*668265503+seed*1442695041)|0;n=(n^(n>>>13))*1274126177;return ((n^(n>>>16))>>>0)/4294967295;};
const lerp=(a,b,t)=>a+(b-a)*t,smooth=t=>t*t*(3-2*t);
export function valueNoise(x,z,scale,seed){const gx=x/scale,gz=z/scale,x0=Math.floor(gx),z0=Math.floor(gz),tx=smooth(gx-x0),tz=smooth(gz-z0);return lerp(lerp(hash(x0,z0,seed),hash(x0+1,z0,seed),tx),lerp(hash(x0,z0+1,seed),hash(x0+1,z0+1,seed),tx),tz);}
export function mountainCenter(seed){return {x:-21+hash(seed,13,42)*9,z:-12+hash(seed,17,8)*15};}
export function riverCenterAt(x,seed){const shift=hash(seed,91,31)*60;return 10+Math.sin((x+shift)*.09)*4.2+Math.sin((x+shift*.37)*.21)*1.4;}
export function terrainSample(x,z,seed){
 const n1=(valueNoise(x,z,27,seed)-.5)*5.8,n2=(valueNoise(x,z,12,seed+11)-.5)*1.8,c=mountainCenter(seed);
 const d1=Math.hypot(x-c.x,(z-c.z)*.88),m1=Math.pow(Math.max(0,1-d1/23),1.55)*14,d2=Math.hypot(x-39,(z-36)*.9),m2=Math.pow(Math.max(0,1-d2/19),1.7)*10.5;
 const ridge=(valueNoise(x,z,8,seed+23)-.5)*2.4,desert=x>17&&z>6,dw=desert?(valueNoise(x,z,17,seed+59)-.5)*1.5:0;
 const baseHeight=Math.max(2,Math.min(25,Math.round(5+n1+n2+m1+m2+ridge*.22+dw))),riverDistance=Math.abs(z-riverCenterAt(x,seed));
 const lc={x:17+hash(seed,21,5)*3,z:-14+hash(seed,28,6)*4},lakeDistance=Math.hypot(x-lc.x,z-lc.z),secondLakeDistance=Math.hypot(x+43,z-43);
 const rt=Math.min(1,riverDistance/14),ri=1-rt*rt*(3-2*rt);let height=Math.round(baseHeight*(1-ri)+(2.5+riverDistance*.2)*ri);
 const lt=Math.min(1,lakeDistance/11),li=1-lt*lt*(3-2*lt);height=Math.round(height*(1-li)+(2.5+lakeDistance*.24)*li);
 const slt=Math.min(1,secondLakeDistance/9),sli=1-slt*slt*(3-2*slt);height=Math.round(height*(1-sli)+(2.8+secondLakeDistance*.2)*sli);
 let biome="meadow";if(desert)biome="desert";else if(baseHeight>=13)biome="mountain";else if(valueNoise(x,z,15,seed+81)>.58)biome="forest";
 let surface="grass";if(desert||riverDistance<4.4||lakeDistance<6.2||secondLakeDistance<5.2)surface="sand";
 if(baseHeight>=17&&!desert&&riverDistance>4.8)surface="snow";else if(baseHeight>=13&&!desert&&riverDistance>4.8)surface="stone";
 return {height,baseHeight,biome,surface,riverDistance,lakeDistance,secondLakeDistance,riverCenter:riverCenterAt(x,seed)};
}
export function chunkAddress(x,z){const ix=Math.floor((x-WORLD_MIN_X)/CHUNK_SIZE),iz=Math.floor((z-WORLD_MIN_Z)/CHUNK_SIZE);if(ix<0||ix>=CHUNKS_X||iz<0||iz>=CHUNKS_Z)return null;return {ix,iz,key:ix+","+iz};}
export function isInsideWorld(x,z){return x>=WORLD_MIN_X&&x<=WORLD_MAX_X&&z>=WORLD_MIN_Z&&z<=WORLD_MAX_Z;}
