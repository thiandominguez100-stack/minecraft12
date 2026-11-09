const keyOf=(x,y,z)=>String(x)+","+String(y)+","+String(z);
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function waterSurfaceY(world,x,y,z){
  const key=keyOf(x,y,z);
  const state=world.waterStates?.get(key);
  if(state?.source||state?.falling||world.waterSources?.has(key)||world.get(x,y+1,z)==="water")return y+.5;
  const level=clamp(Math.floor(Number(state?.level)||1),1,7);
  return y+.5-(level-1)*.075;
}

export function waterCornerY(world,cornerX,y,cornerZ){
  const x0=Math.floor(cornerX+.5-1e-7),z0=Math.floor(cornerZ+.5-1e-7);
  const cells=[[x0,z0],[x0+1,z0],[x0,z0+1],[x0+1,z0+1]];
  let total=0,count=0;
  for(const [x,z] of cells){
    if(world.get(x,y,z)!=="water")continue;
    total+=waterSurfaceY(world,x,y,z);
    count++;
  }
  return count?total/count:y-.5;
}

export function buildWaterSurface(world,waterCells){
  const positions=[],uvs=[],colors=[],indices=[];
  const sharedTopVertices=new Map();
  let topFaces=0,sideFaces=0;

  function vertex(position,uv,shade,share=false){
    const key=position.map(n=>Number(n).toFixed(5)).join(",");
    if(share&&sharedTopVertices.has(key))return sharedTopVertices.get(key);
    const index=positions.length/3;
    positions.push(position[0],position[1],position[2]);
    uvs.push(uv[0],uv[1]);
    colors.push(shade,shade,shade);
    if(share)sharedTopVertices.set(key,index);
    return index;
  }

  function quad(points,uvPoints,shade,share=false){
    const ids=points.map((point,i)=>vertex(point,uvPoints[i],shade,share));
    indices.push(ids[0],ids[1],ids[2],ids[0],ids[2],ids[3]);
  }

  for(const [x,y,z] of waterCells){
    if(world.get(x,y,z)!=="water")continue;

    const west=x-.5,east=x+.5,north=z-.5,south=z+.5,bottom=y-.5;
    const nw=waterCornerY(world,west,y,north);
    const sw=waterCornerY(world,west,y,south);
    const se=waterCornerY(world,east,y,south);
    const ne=waterCornerY(world,east,y,north);

    const above=world.get(x,y+1,z);
    if(above!=="water"&&!world.isSolid(x,y+1,z)){
      quad(
        [[west,nw,north],[west,sw,south],[east,se,south],[east,ne,north]],
        [[west,north],[west,south],[east,south],[east,north]],
        1,
        true
      );
      topFaces++;
    }

    const sideVisible=(nx,ny,nz)=>{
      const id=world.get(nx,ny,nz);
      return id!=="water"&&!world.isSolid(nx,ny,nz);
    };

    if(sideVisible(x-1,y,z)){
      quad(
        [[west,sw,south],[west,nw,north],[west,bottom,north],[west,bottom,south]],
        [[south,y],[north,y],[north,bottom],[south,bottom]],
        .72
      );
      sideFaces++;
    }
    if(sideVisible(x+1,y,z)){
      quad(
        [[east,ne,north],[east,se,south],[east,bottom,south],[east,bottom,north]],
        [[north,y],[south,y],[south,bottom],[north,bottom]],
        .72
      );
      sideFaces++;
    }
    if(sideVisible(x,y,z-1)){
      quad(
        [[west,nw,north],[east,ne,north],[east,bottom,north],[west,bottom,north]],
        [[west,y],[east,y],[east,bottom],[west,bottom]],
        .78
      );
      sideFaces++;
    }
    if(sideVisible(x,y,z+1)){
      quad(
        [[east,se,south],[west,sw,south],[west,bottom,south],[east,bottom,south]],
        [[east,y],[west,y],[west,bottom],[east,bottom]],
        .78
      );
      sideFaces++;
    }
  }

  return {positions,uvs,colors,indices,topFaces,sideFaces};
}
