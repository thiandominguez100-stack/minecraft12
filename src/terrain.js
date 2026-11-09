export const CHUNK_SIZE=16,CHUNKS_X=12,CHUNKS_Z=12,TOTAL_CHUNKS=CHUNKS_X*CHUNKS_Z;
export const WORLD_MIN_X=-96,WORLD_MIN_Z=-96,WORLD_WIDTH=CHUNKS_X*CHUNK_SIZE,WORLD_DEPTH=CHUNKS_Z*CHUNK_SIZE;
export const WORLD_MAX_X=WORLD_MIN_X+WORLD_WIDTH-1,WORLD_MAX_Z=WORLD_MIN_Z+WORLD_DEPTH-1,WATER_LEVEL=5;
export const hash=(x,z,seed=0)=>{let n=(x*374761393+z*668265503+seed*1442695041)|0;n=(n^(n>>>13))*1274126177;return ((n^(n>>>16))>>>0)/4294967295;};
const lerp=(a,b,t)=>a+(b-a)*t,smooth=t=>t*t*(3-2*t);
export function valueNoise(x,z,scale,seed){const gx=x/scale,gz=z/scale,x0=Math.floor(gx),z0=Math.floor(gz),tx=smooth(gx-x0),tz=smooth(gz-z0);return lerp(lerp(hash(x0,z0,seed),hash(x0+1,z0,seed),tx),lerp(hash(x0,z0+1,seed),hash(x0+1,z0+1,seed),tx),tz);}
export function mountainCenter(seed){return {x:-21+hash(seed,13,42)*9,z:-12+hash(seed,17,8)*15};}
export function riverCenterAt(x,seed){const shift=hash(seed,91,31)*60;return 10+Math.sin((x+shift)*.09)*4.2+Math.sin((x+shift*.37)*.21)*1.4;}
export function waterBankHeight(distance,baseHeight,coreRadius,fadeRadius,depth=2.6,edgeHeight=4.55){
 const d=Math.max(0,Number(distance)||0),base=Math.max(0,Number(baseHeight)||0);
 if(d>=fadeRadius)return base;
 const t=Math.max(0,Math.min(1,d/coreRadius));
 const f=Math.max(0,Math.min(1,(d-coreRadius)/(fadeRadius-coreRadius)));
 const target=d<=coreRadius?depth+(edgeHeight-depth)*smooth(t):edgeHeight+(base-edgeHeight)*smooth(f);
 return Math.round(Math.min(base,target));
}
export function terrainSample(x,z,seed){
 const n1=(valueNoise(x,z,31,seed)-.5)*6.2,n2=(valueNoise(x,z,13,seed+11)-.5)*2,c=mountainCenter(seed);
 const d1=Math.hypot(x-c.x,(z-c.z)*.88),m1=Math.pow(Math.max(0,1-d1/25),1.55)*15;
 const d2=Math.hypot(x-39,(z-36)*.9),m2=Math.pow(Math.max(0,1-d2/21),1.7)*11.5;
 const d3=Math.hypot(x+66,(z+55)*.92),m3=Math.pow(Math.max(0,1-d3/23),1.6)*12.5;
 const ridge=(valueNoise(x,z,9,seed+23)-.5)*2.8,desert=x>17&&z>6,dw=desert?(valueNoise(x,z,18,seed+59)-.5)*1.8:0;
 const baseHeight=Math.max(2,Math.min(28,Math.round(5+n1+n2+m1+m2+m3+ridge*.24+dw)));
 const riverDistance=Math.abs(z-riverCenterAt(x,seed));
 const lc1={x:17+hash(seed,21,5)*3,z:-14+hash(seed,28,6)*4};
 const lakeDistance=Math.hypot(x-lc1.x,z-lc1.z),secondLakeDistance=Math.hypot(x+43,z-43),thirdLakeDistance=Math.hypot(x-65,z+53);
 let height=baseHeight;
 height=Math.min(height,waterBankHeight(riverDistance,baseHeight,13.5,24,2.2,4.45));
 height=Math.min(height,waterBankHeight(lakeDistance,baseHeight,13.0,22,2.3,4.45));
 height=Math.min(height,waterBankHeight(secondLakeDistance,baseHeight,10.5,20,2.4,4.45));
 height=Math.min(height,waterBankHeight(thirdLakeDistance,baseHeight,11.0,21,2.3,4.45));
 const nearestLake=Math.min(lakeDistance,secondLakeDistance,thirdLakeDistance);
 const isWaterColumn=height<WATER_LEVEL&&(riverDistance<=13.4||nearestLake<=12.8);
 const riverSource=riverDistance<=1.25&&((x+seed)%5===0);
 const lakeSource=nearestLake<=2.8&&hash(x,z,seed+811)>.62;
 let biome="meadow";if(desert)biome="desert";else if(baseHeight>=13)biome="mountain";else if(valueNoise(x,z,16,seed+81)>.57)biome="forest";
 let surface="grass";if(desert||riverDistance<15||nearestLake<13)surface="sand";
 if(baseHeight>=19&&!desert&&riverDistance>4.8)surface="snow";else if(baseHeight>=14&&!desert&&riverDistance>4.8)surface="stone";
 return {height,baseHeight,biome,surface,riverDistance,lakeDistance,secondLakeDistance,thirdLakeDistance,riverCenter:riverCenterAt(x,seed),isWaterColumn,waterSource:isWaterColumn&&(riverSource||lakeSource)};
}
export function chunkAddress(x,z){const ix=Math.floor((x-WORLD_MIN_X)/CHUNK_SIZE),iz=Math.floor((z-WORLD_MIN_Z)/CHUNK_SIZE);if(ix<0||ix>=CHUNKS_X||iz<0||iz>=CHUNKS_Z)return null;return {ix,iz,key:ix+","+iz};}
export function isInsideWorld(x,z){return x>=WORLD_MIN_X&&x<=WORLD_MAX_X&&z>=WORLD_MIN_Z&&z<=WORLD_MAX_Z;}
