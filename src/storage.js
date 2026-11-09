const KEY="blockworld3d.infinite-grass.save.v1";
export function saveGame(data){try{localStorage.setItem(KEY,JSON.stringify({...data,savedAt:new Date().toISOString()}));return true}catch(e){console.error("No se pudo guardar el mundo",e);return false}}
export function loadGame(){try{const raw=localStorage.getItem(KEY);return raw?JSON.parse(raw):null}catch(e){console.error("No se pudo leer la partida",e);return null}}
export function deleteSave(){localStorage.removeItem(KEY)}
