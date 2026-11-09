import * as THREE from "three";
import {BLOCKS} from "./data.js";
import {makeBlockTexture} from "./textures.js";
import {atlasTileRect,ATLAS_COLUMNS,ATLAS_ROWS,ATLAS_TILE_SIZE} from "./atlas-layout.js";

let sharedResources=null;
function createAtlasTexture(){
 const canvas=document.createElement("canvas");
 canvas.width=ATLAS_COLUMNS*ATLAS_TILE_SIZE;canvas.height=ATLAS_ROWS*ATLAS_TILE_SIZE;
 const ctx=canvas.getContext("2d",{alpha:true});
 ctx.clearRect(0,0,canvas.width,canvas.height);
 const rects=new Map();
 BLOCKS.forEach((block,blockIndex)=>{
  const faces=[];
  for(let face=0;face<6;face++){
   const texture=makeBlockTexture(block,["right","left","top","bottom","front","back"][face]);
   const image=texture.image,column=(blockIndex*6+face)%ATLAS_COLUMNS,row=Math.floor((blockIndex*6+face)/ATLAS_COLUMNS);
   ctx.drawImage(image,column*ATLAS_TILE_SIZE,row*ATLAS_TILE_SIZE,ATLAS_TILE_SIZE,ATLAS_TILE_SIZE);
   texture.dispose();
   faces.push(atlasTileRect(blockIndex,face));
  }
  rects.set(block.id,faces);
 });
 const texture=new THREE.CanvasTexture(canvas);
 texture.colorSpace=THREE.SRGBColorSpace;
 texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;
 texture.generateMipmaps=false;texture.wrapS=THREE.ClampToEdgeWrapping;texture.wrapT=THREE.ClampToEdgeWrapping;
 texture.needsUpdate=true;
 return {texture,rects};
}
function createAtlasMaterial(texture,settings={},variant="opaque"){
 const material=new THREE.MeshLambertMaterial({map:texture,...settings});
 material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace(
   "#include <common>",
   "#include <common>\nattribute vec4 atlasRect;\nvarying vec4 vAtlasRect;"
  );
  shader.vertexShader=shader.vertexShader.replace(
   "#include <begin_vertex>",
   "#include <begin_vertex>\nvAtlasRect = atlasRect;"
  );
  shader.fragmentShader=shader.fragmentShader.replace(
   "#include <common>",
   "#include <common>\nvarying vec4 vAtlasRect;"
  );
  const standardSample="texture2D( map, vMapUv )";
  const atlasSample="texture2D( map, vAtlasRect.xy + fract(vMapUv) * vAtlasRect.zw )";
  if(shader.fragmentShader.includes(standardSample))shader.fragmentShader=shader.fragmentShader.replaceAll(standardSample,atlasSample);
  else if(shader.fragmentShader.includes("texture2D(map, vMapUv)"))shader.fragmentShader=shader.fragmentShader.replaceAll("texture2D(map, vMapUv)",atlasSample);
 };
 material.customProgramCacheKey=()=>"blockworld-atlas-r1-"+variant;
 material.needsUpdate=true;
 return material;
}
export function getBlockAtlasResources(){
 if(sharedResources)return sharedResources;
 const {texture,rects}=createAtlasTexture();
 sharedResources={
  texture,rects,
  materials:{
   opaque:createAtlasMaterial(texture,{},"opaque"),
   cutout:createAtlasMaterial(texture,{alphaTest:.42,transparent:false,depthWrite:true},"cutout"),
   glass:createAtlasMaterial(texture,{transparent:true,opacity:.68,depthWrite:false,side:THREE.DoubleSide},"glass")
  }
 };
 return sharedResources;
}
