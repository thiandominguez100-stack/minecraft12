const ATLAS_SAMPLE="texture2D( map, vAtlasRect.xy + fract( vMapUv ) * vAtlasRect.zw )";

function injectAfter(source,token,addition,label){
 if(!source.includes(token))throw new Error("Three.js shader is missing "+label+" insertion point");
 return source.replace(token,token+"\n"+addition);
}

export function patchAtlasShader(shader){
 if(!shader||typeof shader.vertexShader!=="string"||typeof shader.fragmentShader!=="string")
  throw new TypeError("A valid Three.js shader program is required");

 shader.vertexShader=injectAfter(
  shader.vertexShader,
  "#include <common>",
  "attribute vec4 atlasRect;\nvarying vec4 vAtlasRect;",
  "vertex common"
 );
 shader.vertexShader=injectAfter(
  shader.vertexShader,
  "#include <begin_vertex>",
  "vAtlasRect = atlasRect;",
  "vertex begin_vertex"
 );
 shader.fragmentShader=injectAfter(
  shader.fragmentShader,
  "#include <common>",
  "varying vec4 vAtlasRect;",
  "fragment common"
 );

 const mapChunk="#include <map_fragment>";
 if(!shader.fragmentShader.includes(mapChunk))
  throw new Error("Three.js shader is missing map_fragment; refusing to render the full atlas on every block");
 const atlasMapChunk=`#ifdef USE_MAP
 vec4 sampledDiffuseColor = ${ATLAS_SAMPLE};
 diffuseColor *= sampledDiffuseColor;
#endif`;
 shader.fragmentShader=shader.fragmentShader.replace(mapChunk,atlasMapChunk);
 if(shader.fragmentShader.includes(mapChunk)||!shader.fragmentShader.includes(ATLAS_SAMPLE))
  throw new Error("Could not safely install the block texture atlas sampler");
 return shader;
}
