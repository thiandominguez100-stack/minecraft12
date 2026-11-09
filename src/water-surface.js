const keyOf=(x,y,z)=>String(x)+","+String(y)+","+String(z);
const SURFACE_OFFSET=.012,GRID=3;
export function waterSurfaceY(world,x,y,z){return y+.5+SURFACE_OFFSET;}
export function waterCornerY(world,cx,y,cz){return y+.5+SURFACE_OFFSET;}
export function buildWaterSurface(world,cells){
 const positions=[],uvs=[],waveWeights=[],indices=[];let topFaces=0,sideFaces=0;
 const vertex=(x,y,z,u,v,wave=0)=>{
  const index=positions.length/3;positions.push(x,y,z);uvs.push(u,v);waveWeights.push(wave);return index;
 };
 const quad=(points)=>{
  const ids=points.map(p=>vertex(...p));
  indices.push(ids[0],ids[1],ids[2],ids[0],ids[2],ids[3]);
 };
 for(const [x,y,z] of cells){
  if(world.get(x,y,z)!=="water")continue;
  const west=x-.5,east=x+.5,north=z-.5,south=z+.5,top=y+.5+SURFACE_OFFSET,bottom=y-.5;
  if(world.get(x,y+1,z)!=="water"&&!world.isSolid(x,y+1,z)){
   const grid=[];
   for(let gz=0;gz<=GRID;gz++){
    const row=[],tz=gz/GRID;
    for(let gx=0;gx<=GRID;gx++){
     const tx=gx/GRID,px=west+tx,pz=north+tz;
     row.push(vertex(px,top,pz,px*.11,pz*.11,1));
    }
    grid.push(row);
   }
   for(let gz=0;gz<GRID;gz++)for(let gx=0;gx<GRID;gx++){
    const a=grid[gz][gx],b=grid[gz+1][gx],c=grid[gz+1][gx+1],d=grid[gz][gx+1];
    indices.push(a,b,c,a,c,d);
   }
   topFaces++;
  }
  const open=(nx,ny,nz)=>world.get(nx,ny,nz)!=="water"&&!world.isSolid(nx,ny,nz);
  if(open(x-1,y,z)){quad([[west,top,south,west*.11,south*.11,1],[west,top,north,west*.11,north*.11,1],[west,bottom,north,west*.11,north*.11,0],[west,bottom,south,west*.11,south*.11,0]]);sideFaces++;}
  if(open(x+1,y,z)){quad([[east,top,north,east*.11,north*.11,1],[east,top,south,east*.11,south*.11,1],[east,bottom,south,east*.11,south*.11,0],[east,bottom,north,east*.11,north*.11,0]]);sideFaces++;}
  if(open(x,y,z-1)){quad([[west,top,north,west*.11,north*.11,1],[east,top,north,east*.11,north*.11,1],[east,bottom,north,east*.11,north*.11,0],[west,bottom,north,west*.11,north*.11,0]]);sideFaces++;}
  if(open(x,y,z+1)){quad([[east,top,south,east*.11,south*.11,1],[west,top,south,west*.11,south*.11,1],[west,bottom,south,west*.11,south*.11,0],[east,bottom,south,east*.11,south*.11,0]]);sideFaces++;}
 }
 return {positions,uvs,waveWeights,indices,topFaces,sideFaces};
}
