const keyOf=(x,y,z)=>String(x)+","+String(y)+","+String(z);
const SURFACE_OFFSET=.012;
export function waterSurfaceY(world,x,y,z){return y+.5+SURFACE_OFFSET;}
export function waterCornerY(world,cx,y,cz){return y+.5+SURFACE_OFFSET;}
export function buildWaterSurface(world,cells){
 const positions=[],uvs=[],indices=[];let topFaces=0,sideFaces=0;
 const vertex=(x,y,z,u,v)=>{const index=positions.length/3;positions.push(x,y,z);uvs.push(u,v);return index;};
 const quad=(points)=>{
  const a=vertex(...points[0]),b=vertex(...points[1]),c=vertex(...points[2]),d=vertex(...points[3]);
  indices.push(a,b,c,a,c,d);
 };
 for(const [x,y,z] of cells){
  if(world.get(x,y,z)!=="water")continue;
  const west=x-.5,east=x+.5,north=z-.5,south=z+.5,top=y+.5+SURFACE_OFFSET,bottom=y-.5;
  if(world.get(x,y+1,z)!=="water"&&!world.isSolid(x,y+1,z)){
   quad([[west,top,north,west,north],[west,top,south,west,south],[east,top,south,east,south],[east,top,north,east,north]]);
   topFaces++;
  }
  const open=(nx,ny,nz)=>world.get(nx,ny,nz)!=="water"&&!world.isSolid(nx,ny,nz);
  if(open(x-1,y,z)){quad([[west,top,south,west,south],[west,top,north,west,north],[west,bottom,north,west,north],[west,bottom,south,west,south]]);sideFaces++;}
  if(open(x+1,y,z)){quad([[east,top,north,east,north],[east,top,south,east,south],[east,bottom,south,east,south],[east,bottom,north,east,north]]);sideFaces++;}
  if(open(x,y,z-1)){quad([[west,top,north,west,north],[east,top,north,east,north],[east,bottom,north,east,north],[west,bottom,north,west,north]]);sideFaces++;}
  if(open(x,y,z+1)){quad([[east,top,south,east,south],[west,top,south,west,south],[west,bottom,south,west,south],[east,bottom,south,east,south]]);sideFaces++;}
 }
 return {positions,uvs,indices,topFaces,sideFaces};
}
