export const CAMERA_VIEW_MODES=Object.freeze([
 {id:0,label:"Primera persona"},
 {id:1,label:"Tercera persona trasera"},
 {id:2,label:"Tercera persona frontal"}
]);
export function nextCameraView(current){return (Math.trunc(Number(current)||0)+1)%CAMERA_VIEW_MODES.length;}
export function cameraViewLabel(mode){return CAMERA_VIEW_MODES[Math.max(0,Math.min(2,Math.trunc(Number(mode)||0)))]?.label||CAMERA_VIEW_MODES[0].label;}
