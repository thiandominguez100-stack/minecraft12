export const ATLAS_COLUMNS=16,ATLAS_ROWS=16,ATLAS_TILE_SIZE=64;
export function atlasTileRect(blockIndex,faceIndex){
 if(!Number.isInteger(blockIndex)||blockIndex<0)throw new RangeError("blockIndex must be a non-negative integer");
 if(!Number.isInteger(faceIndex)||faceIndex<0||faceIndex>5)throw new RangeError("faceIndex must be between 0 and 5");
 const tile=blockIndex*6+faceIndex,column=tile%ATLAS_COLUMNS,row=Math.floor(tile/ATLAS_COLUMNS);
 if(row>=ATLAS_ROWS)throw new RangeError("Block texture atlas is full");
 const atlasWidth=ATLAS_COLUMNS*ATLAS_TILE_SIZE,atlasHeight=ATLAS_ROWS*ATLAS_TILE_SIZE;
 const inset=.5,usableSize=ATLAS_TILE_SIZE-1;
 return [
  (column*ATLAS_TILE_SIZE+inset)/atlasWidth,
  ((ATLAS_ROWS-1-row)*ATLAS_TILE_SIZE+inset)/atlasHeight,
  usableSize/atlasWidth,
  usableSize/atlasHeight
 ];
}
