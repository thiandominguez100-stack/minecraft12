const keyOf=(x,y,z)=>String(x)+","+String(y)+","+String(z),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),GRID=6;
export function waterSurfaceY(world,x,y,z){const k=keyOf(x,y,z),s=world.waterStates?.get(k);if(s?.source||s?.falling||s?.settled||world.waterSources?.has(k)||world.get(x,y+1,z)==="water")return y+.5;return y+.5-(clamp(Number(s?.level)||1,1,7)-1)*.075;}
export function waterCornerY(world,cx,y,cz){const x0=Math.floor(cx+.5-1e-7),z0=Math.floor(cz+.5-1e-7),cells=[[x0,z0],[x0+1,z0],[x0,z0+1],[x0+1,z0+1]];let total=0,count=0;for(const [x,z] of cells)if(world.get(x,y,z)==="water"){total+=waterSurfaceY(world,x,y,z);count++;}return count?total/count:y-.5;}
export function buildWaterSurface(world,cells){
 const positions=[],uvs=[],colors=[],waveWeights=[],indices=[],cache=new Map();let topFaces=0,sideFaces=0;
 function vert(p,shade,wave=0,share=false,uv=null){const k=p.map(n=>Number(n).toFixed(5)).join(",");if(share&&cache.has(k))return cache.get(k);const i=positions.length/3;positions.push(...p);uvs.push(...(uv||[p[0]*.055,p[2]*.055]));colors.push(shade,shade,shade);waveWeights.push(wave);if(share)cache.set(k,i);return i;}
 function side(points,tex,shade){const ids=points.map((p,i)=>vert(p,shade,0,false,tex[i]));indices.push(ids[0],ids[1],ids[2],ids[0],ids[2],ids[3]);}
 for(const [x,y,z] of cells){if(world.get(x,y,z)!=="water")continue;const w=x-.5,e=x+.5,n=z-.5,s=z+.5,b=y-.5,nw=waterCornerY(world,w,y,n),sw=waterCornerY(world,w,y,s),se=waterCornerY(world,e,y,s),ne=waterCornerY(world,e,y,n);
  if(world.get(x,y+1,z)!=="water"&&!world.isSolid(x,y+1,z)){const grid=[];for(let gz=0;gz<=GRID;gz++){const tz=gz/GRID,row=[];for(let gx=0;gx<=GRID;gx++){const tx=gx/GRID,ny=nw+(ne-nw)*tx,sy=sw+(se-sw)*tx,px=w+tx,pz=n+tz,py=ny+(sy-ny)*tz;row.push(vert([px,py,pz],1,1,true,[px*.055,pz*.055]));}grid.push(row);}for(let gz=0;gz<GRID;gz++)for(let gx=0;gx<GRID;gx++){const a=grid[gz][gx],bb=grid[gz+1][gx],c=grid[gz+1][gx+1],d=grid[gz][gx+1];indices.push(a,bb,c,a,c,d);}topFaces++;}
  const visible=(nx,ny,nz)=>world.get(nx,ny,nz)!=="water"&&!world.isSolid(nx,ny,nz);
  if(visible(x-1,y,z)){side([[w,sw,s],[w,nw,n],[w,b,n],[w,b,s]],[[s*.055,sw*.055],[n*.055,nw*.055],[n*.055,b*.055],[s*.055,b*.055]],.68);sideFaces++;}
  if(visible(x+1,y,z)){side([[e,ne,n],[e,se,s],[e,b,s],[e,b,n]],[[n*.055,ne*.055],[s*.055,se*.055],[s*.055,b*.055],[n*.055,b*.055]],.68);sideFaces++;}
  if(visible(x,y,z-1)){side([[w,nw,n],[e,ne,n],[e,b,n],[w,b,n]],[[w*.055,nw*.055],[e*.055,ne*.055],[e*.055,b*.055],[w*.055,b*.055]],.76);sideFaces++;}
  if(visible(x,y,z+1)){side([[e,se,s],[w,sw,s],[w,b,s],[e,b,s]],[[e*.055,se*.055],[w*.055,sw*.055],[w*.055,b*.055],[e*.055,b*.055]],.76);sideFaces++;}
 }return {positions,uvs,colors,waveWeights,indices,topFaces,sideFaces};
}
