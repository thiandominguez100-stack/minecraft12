import test from "node:test";
import assert from "node:assert/strict";
import {CAMERA_VIEW_MODES,nextCameraView,cameraViewLabel} from "../src/view-mode.js";
test("camera cycles through first person, rear third person and front third person",()=>{
 assert.equal(nextCameraView(0),1);assert.equal(nextCameraView(1),2);assert.equal(nextCameraView(2),0);
});
test("camera mode labels remain localized and distinct",()=>{
 assert.equal(CAMERA_VIEW_MODES.length,3);
 assert.equal(cameraViewLabel(0),"Primera persona");
 assert.equal(cameraViewLabel(1),"Tercera persona trasera");
 assert.equal(cameraViewLabel(2),"Tercera persona frontal");
});
