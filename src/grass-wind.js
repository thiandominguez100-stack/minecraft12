import {hash} from "./terrain.js";
export function createGrassBladeLayout(seed,entries){
 const blades=[];
 for(const block of entries){if(block.id!=="grass"||block.y!==0)continue;const {x,z}=block;
  for(let blade=0;blade<4;blade++){const o=blade*17,rx=hash(x+o,z-o,seed+101),rz=hash(x-o,z+o,seed+211);
   blades.push({x:x+.12+rx*.76,y:.505,z:z+.12+rz*.76,angle:hash(x+o*3,z-o*5,seed+307)*Math.PI,height:.52+hash(x+o,z+blade,seed+401)*.48,width:.78+hash(x-blade,z+o,seed+503)*.52,shade:.30+hash(x+o,z+o,seed+601)*.14});
  }
 }
 return blades;
}
export function windStrengthForWeather(weather="clear",time=0){return (weather==="rain"?.39:.29)+.065*(.5+.5*Math.sin(time*.19+1.1));}
export function patchGrassWindShader(shader,uniforms){
 if(!shader||typeof shader.vertexShader!=="string")throw new TypeError("Invalid grass shader");
 const common="#include <common>",begin="#include <begin_vertex>";
 if(!shader.vertexShader.includes(common))throw new Error("Grass shader is missing the common chunk");
 if(!shader.vertexShader.includes(begin))throw new Error("Grass shader is missing the begin_vertex chunk");
 shader.uniforms.uWindTime=uniforms.time;shader.uniforms.uWindStrength=uniforms.strength;
 shader.vertexShader=shader.vertexShader.replace(common,common+"\nuniform float uWindTime;\nuniform float uWindStrength;");
 shader.vertexShader=shader.vertexShader.replace(begin,begin+`
#ifdef USE_INSTANCING
 float bladeHeight = clamp(position.y, 0.0, 1.0);
 float windPhase = uWindTime * 1.38 + instanceMatrix[3].x * 0.115 + instanceMatrix[3].z * 0.087;
 float gust = sin(windPhase) * 0.68 + sin(windPhase * 0.47 + 1.4) * 0.32;
 float crossGust = cos(windPhase * 0.73 - 0.8);
 transformed.x += gust * uWindStrength * bladeHeight * bladeHeight;
 transformed.z += crossGust * uWindStrength * 0.34 * bladeHeight * bladeHeight;
#endif`);
 return shader;
}
export function createGrassBladeGeometry(THREE){const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute([-.075,0,0,.075,0,0,.032,.48,.012,-.012,1,.055],3));g.setIndex([0,1,2,1,3,2]);g.computeVertexNormals();g.computeBoundingSphere();return g;}
export function createGrassBladeMaterial(THREE,uniforms){const m=new THREE.MeshLambertMaterial({color:0xffffff,vertexColors:true,side:THREE.DoubleSide,transparent:false,depthWrite:true});m.onBeforeCompile=s=>patchGrassWindShader(s,uniforms);m.customProgramCacheKey=()=>"blockworld-grass-wind-v1";return m;}
