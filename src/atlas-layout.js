export const ATLAS_COLUMNS=16,ATLAS_ROWS=16,ATLAS_TILE_SIZE=64;
export function atlasTileRect(blockIndex,faceIndex){
 if(!Number.isInteger(blockIndex)||blockIndex<0)throw new RangeError("blockIndex must be a non-negative integer");
 if(!Number.isInteger(faceIndex)||faceIndex<0||faceIndex>5)throw new RangeError("faceIndex must be between 0 and 5");
 const tile=blockIndex*6+faceIndex,column=tile%ATLAS_COLUMNS,row=Math.floor(tile/ATLAS_COLUMNS);
 if(row>=ATLAS_ROWS)throw new RangeError("Block texture atlas is full");
 const size=1/ATLAS_COLUMNS;
 return [column*size,(ATLAS_ROWS-1-row)*size,size,size];
}
