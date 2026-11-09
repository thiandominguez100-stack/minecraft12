const clamp01=value=>Math.max(0,Math.min(1,value));
function smoothstep(a,b,v){const t=clamp01((v-a)/(b-a));return t*t*(3-2*t);}
export function normalizeDayTime(value,fallback=.25){const n=Number(value);if(!Number.isFinite(n))return fallback;return ((n%1)+1)%1;}
export function getAtmosphereState(dayTime,weather="clear"){
 const time=normalizeDayTime(dayTime),angle=time*Math.PI*2,sunHeight=Math.sin(angle);
 const daylight=smoothstep(-.16,.22,sunHeight),twilight=1-smoothstep(.02,.58,Math.abs(sunHeight));
 const sunVisibility=smoothstep(-.08,.14,sunHeight),moonVisibility=smoothstep(-.08,.14,-sunHeight);
 const starsVisibility=.92*smoothstep(.06,.42,-sunHeight),raining=weather==="rain";
 return {time,angle,sunHeight,daylight,twilight,sunVisibility,moonVisibility,starsVisibility,cloudOpacity:raining?.98:.86,cloudDarkness:raining?.72:0,raining};
}
function seededRandom(seed){let state=(Number(seed)>>>0)||0x6d2b79f5;return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
export function createCloudLayout(seed=1,clusterCount=14){
 if(!Number.isInteger(clusterCount)||clusterCount<1||clusterCount>64)throw new RangeError("clusterCount must be an integer from 1 to 64");
 const random=seededRandom(seed),result=[],add=(x,y,z,width,height,depth)=>result.push({x,y,z,width,height,depth});
 for(let i=0;i<clusterCount;i++){
  const x=(random()-.5)*184,z=(random()-.5)*184,y=33+random()*7,width=5+random()*6.5,depth=4+random()*5;
  add(x,y,z,width,1.5+random()*.8,depth);
  add(x-width*.40,y+.35,z,width*.53,1.9+random()*.8,depth*.78);
  add(x+width*.40,y+.28,z,width*.52,1.8+random()*.8,depth*.8);
  add(x,y+.22,z-depth*.38,width*.62,1.7+random()*.7,depth*.55);
  add(x,y+.24,z+depth*.38,width*.65,1.7+random()*.7,depth*.55);
  add(x,y+1.18,z,width*.55,2.3+random()*.65,depth*.58);
 }
 return result;
}
export function createStarPositions(count=220,radius=165){
 if(!Number.isInteger(count)||count<1||count>2000)throw new RangeError("star count must be from 1 to 2000");
 if(!Number.isFinite(radius)||radius<=0)throw new RangeError("star radius must be positive");
 const out=new Array(count*3),golden=Math.PI*(3-Math.sqrt(5));
 for(let i=0;i<count;i++){const y=.08+.92*((i+.5)/count),ring=Math.sqrt(Math.max(0,1-y*y)),a=i*golden;out[i*3]=Math.cos(a)*ring*radius;out[i*3+1]=y*radius;out[i*3+2]=Math.sin(a)*ring*radius;}
 return out;
}
