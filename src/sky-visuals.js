import {createCloudLayout,createStarPositions,getAtmosphereState} from "./atmosphere-state.js";
export function createAtmosphere(THREE,scene,seed=20261109){
 const root=new THREE.Group();root.name="BlockWorldAtmosphere";
 const nightTop=new THREE.Color(0x071426),dayTop=new THREE.Color(0x4f9bd4),nightHorizon=new THREE.Color(0x172a43),dayHorizon=new THREE.Color(0xb8e0f4),sunsetHorizon=new THREE.Color(0xf0a16f),nightBottom=new THREE.Color(0x0b1424),dayBottom=new THREE.Color(0x7899aa);
 const skyMaterial=new THREE.ShaderMaterial({
  uniforms:{uTopColor:{value:nightTop.clone()},uHorizonColor:{value:nightHorizon.clone()},uBottomColor:{value:nightBottom.clone()}},
  vertexShader:`varying vec3 vSkyDirection;
void main(){vSkyDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`precision highp float;
uniform vec3 uTopColor;
uniform vec3 uHorizonColor;
uniform vec3 uBottomColor;
varying vec3 vSkyDirection;
void main(){
 float h=normalize(vSkyDirection).y;
 float hMix=smoothstep(-0.42,0.06,h);
 float tMix=smoothstep(-0.04,0.78,h);
 vec3 lower=mix(uBottomColor,uHorizonColor,hMix);
 vec3 upper=mix(uHorizonColor,uTopColor,tMix);
 vec3 color=mix(lower,upper,step(0.0,h));
 vec3 lowColor=color*12.92;
 vec3 highColor=1.055*pow(max(color,vec3(0.0)),vec3(1.0/2.4))-0.055;
 vec3 outputColor=mix(highColor,lowColor,1.0-step(vec3(0.0031308),color));
 gl_FragColor=vec4(outputColor,1.0);
}`,
  side:THREE.BackSide,depthWrite:false,depthTest:false,toneMapped:false
 });
 const skyDome=new THREE.Mesh(new THREE.SphereGeometry(190,32,20),skyMaterial);skyDome.name="AtmosphericGradientSky";skyDome.frustumCulled=false;skyDome.renderOrder=-1000;root.add(skyDome);
 const starsGeo=new THREE.BufferGeometry();starsGeo.setAttribute("position",new THREE.Float32BufferAttribute(createStarPositions(240,174),3));
 const starsMat=new THREE.PointsMaterial({color:0xe7f1ff,size:1.55,sizeAttenuation:false,transparent:true,opacity:0,depthWrite:false,fog:false,toneMapped:false,blending:THREE.AdditiveBlending});
 const stars=new THREE.Points(starsGeo,starsMat);stars.name="NightSkyStars";stars.frustumCulled=false;stars.renderOrder=-900;root.add(stars);
 const glowMat=new THREE.MeshBasicMaterial({color:0xffc66e,transparent:true,opacity:0,depthWrite:false,toneMapped:false});
 const sunGlow=new THREE.Mesh(new THREE.SphereGeometry(7.1,16,12),glowMat);sunGlow.name="SunAtmosphericGlow";sunGlow.renderOrder=-880;sunGlow.frustumCulled=false;root.add(sunGlow);
 const sunMat=new THREE.MeshBasicMaterial({color:0xffe2a0,transparent:true,opacity:0,depthWrite:false,toneMapped:false});
 const sun=new THREE.Mesh(new THREE.SphereGeometry(4.1,20,14),sunMat);sun.name="SunDisc";sun.renderOrder=-879;sun.frustumCulled=false;root.add(sun);
 const moonMat=new THREE.MeshBasicMaterial({color:0xe2edff,transparent:true,opacity:0,depthWrite:false,toneMapped:false});
 const moon=new THREE.Mesh(new THREE.SphereGeometry(3.25,18,12),moonMat);moon.name="MoonDisc";moon.renderOrder=-879;moon.frustumCulled=false;root.add(moon);
 const cloudGroup=new THREE.Group();cloudGroup.name="VoxelCloudLayer";
 const cloudMat=new THREE.MeshBasicMaterial({color:0xf4f8ff,transparent:true,opacity:.86,depthWrite:false,depthTest:true,fog:true});
 const layout=createCloudLayout(seed,14),cloudMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),cloudMat,layout.length),dummy=new THREE.Object3D();
 for(let i=0;i<layout.length;i++){const p=layout[i];dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,0,0);dummy.scale.set(p.width,p.height,p.depth);dummy.updateMatrix();cloudMesh.setMatrixAt(i,dummy.matrix);}
 cloudMesh.instanceMatrix.needsUpdate=true;cloudMesh.count=layout.length;cloudMesh.name="VoxelCloudInstances";cloudMesh.frustumCulled=false;cloudMesh.renderOrder=2;cloudGroup.add(cloudMesh);scene.add(root,cloudGroup);
 const direction=new THREE.Vector3(),dayCloud=new THREE.Color(0xf4f8ff),nightCloud=new THREE.Color(0x77869c),stormCloud=new THREE.Color(0x566879);
 const update=(position,dayTime,weather="clear",elapsed=0)=>{
  const state=getAtmosphereState(dayTime,weather);root.position.copy(position);
  direction.set(Math.cos(state.angle),Math.sin(state.angle),.24).normalize();
  sun.position.copy(direction).multiplyScalar(158);sunGlow.position.copy(sun.position);moon.position.copy(direction).multiplyScalar(-158);
  sunMat.opacity=state.sunVisibility;glowMat.opacity=state.sunVisibility*(.13+state.twilight*.12);moonMat.opacity=state.moonVisibility;
  starsMat.opacity=state.starsVisibility*(.91+.09*Math.sin(elapsed*2.1));stars.visible=starsMat.opacity>.015;
  const top=nightTop.clone().lerp(dayTop,state.daylight),horizon=nightHorizon.clone().lerp(dayHorizon,state.daylight);horizon.lerp(sunsetHorizon,state.twilight*.62);
  const bottom=nightBottom.clone().lerp(dayBottom,state.daylight);
  skyMaterial.uniforms.uTopColor.value.copy(top);skyMaterial.uniforms.uHorizonColor.value.copy(horizon);skyMaterial.uniforms.uBottomColor.value.copy(bottom);
  cloudMat.color.copy(nightCloud).lerp(dayCloud,state.daylight);if(state.raining)cloudMat.color.lerp(stormCloud,.72);
  cloudMat.opacity=state.cloudOpacity;cloudGroup.position.set(position.x,0,position.z);cloudGroup.rotation.y=elapsed*.00048;
  return {...state,horizonColor:horizon};
 };
 return {root,skyDome,stars,sun,moon,cloudGroup,cloudMesh,cloudCount:layout.length,update};
}
