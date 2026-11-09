export const CHUNK_SIZE=16;
export const CHUNKS_X=4;
export const CHUNKS_Z=3;
export const TOTAL_CHUNKS=CHUNKS_X*CHUNKS_Z;
export const WORLD_MIN_X=-32;
export const WORLD_MIN_Z=-24;
export const WORLD_WIDTH=CHUNKS_X*CHUNK_SIZE;
export const WORLD_DEPTH=CHUNKS_Z*CHUNK_SIZE;
export const WORLD_MAX_X=WORLD_MIN_X+WORLD_WIDTH-1;
export const WORLD_MAX_Z=WORLD_MIN_Z+WORLD_DEPTH-1;
export const WATER_LEVEL=5;

export const hash=(x,z,seed=0)=>{
  let n=(x*374761393+z*668265263+seed*1442695041)|0;
  n=(n^(n>>>13))*1274126177;
  return ((n^(n>>>16))>>>0)/4294967295;
};
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);

export function valueNoise(x,z,scale,seed){
  const gx=x/scale,gz=z/scale,x0=Math.floor(gx),z0=Math.floor(gz);
  const tx=smooth(gx-x0),tz=smooth(gz-z0);
  const a=lerp(hash(x0,z0,seed),hash(x0+1,z0,seed),tx);
  const b=lerp(hash(x0,z0+1,seed),hash(x0+1,z0+1,seed),tx);
  return lerp(a,b,tz);
}
export function mountainCenter(seed){
  return {x:-21+hash(seed,13,42)*9,z:-12+hash(seed,17,8)*15};
}
export function riverCenterAt(x,seed){
  const shift=hash(seed,91,31)*60;
  return -2+Math.sin((x+shift)*.09)*5+Math.sin((x+shift*.37)*.21)*1.7;
}
export function terrainSample(x,z,seed){
  const n1=(valueNoise(x,z,22,seed)-.5)*5.2;
  const n2=(valueNoise(x,z,10,seed+11)-.5)*1.4;
  const center=mountainCenter(seed);
  const mountainDistance=Math.hypot(x-center.x,(z-center.z)*.88);
  const mountain=Math.pow(Math.max(0,1-mountainDistance/21),1.55)*13.5;
  const ridge=(valueNoise(x,z,7,seed+23)-.5)*2;
  const desert=x>17&&z>6;
  const desertWave=desert?(valueNoise(x,z,12,seed+59)-.5)*1.2:0;
  const baseHeight=Math.max(2,Math.min(23,Math.round(5+n1+n2+mountain+ridge*.22+desertWave)));
  const riverDistance=Math.abs(z-riverCenterAt(x,seed));
  const lakeCenter={x:17+hash(seed,21,5)*3,z:-14+hash(seed,28,6)*4};
  const lakeDistance=Math.hypot(x-lakeCenter.x,z-lakeCenter.z);
  let height=baseHeight;
  if(riverDistance<4.8)height=Math.min(height,Math.round(2+riverDistance*1.1));
  if(lakeDistance<5.6)height=Math.min(height,Math.round(2+lakeDistance*.48));
  let biome="meadow";
  if(desert)biome="desert";
  else if(baseHeight>=13)biome="mountain";
  else if(valueNoise(x,z,13,seed+81)>.59)biome="forest";
  let surface="grass";
  if(desert||riverDistance<4.4||lakeDistance<6.2)surface="sand";
  if(baseHeight>=16&&!desert&&riverDistance>4.8)surface="snow";
  else if(baseHeight>=13&&!desert&&riverDistance>4.8)surface="stone";
  return {height,baseHeight,biome,surface,riverDistance,lakeDistance,riverCenter:riverCenterAt(x,seed)};
}
export function chunkAddress(x,z){
  const ix=Math.floor((x-WORLD_MIN_X)/CHUNK_SIZE),iz=Math.floor((z-WORLD_MIN_Z)/CHUNK_SIZE);
  if(ix<0||ix>=CHUNKS_X||iz<0||iz>=CHUNKS_Z)return null;
  return {ix,iz,key:ix+","+iz};
}
export function isInsideWorld(x,z){
  return x>=WORLD_MIN_X&&x<=WORLD_MAX_X&&z>=WORLD_MIN_Z&&z<=WORLD_MAX_Z;
}
