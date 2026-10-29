import fs from 'node:fs';import assert from 'node:assert/strict';
const face=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('assets/ck-face-atlas-v35.js')).toString('base64'));
const lm=face.FACE_LANDMARKS;
assert.equal((lm.leftEye[0]+lm.rightEye[0])/2,lm.nose[0]);assert.equal(lm.leftEye[1],lm.rightEye[1]);assert.ok(lm.nose[1]>lm.leftEye[1]&&lm.mouth[1]>lm.nose[1]);
assert.ok(face.faceSVG(false).includes('url(#iris)'));assert.ok(!face.faceSVG(true).includes('fill="url(#iris)"'));
const kit=fs.readFileSync('assets/ck-mascot-kit-v33.js','utf8');assert.ok(kit.includes('attachFace(T,head,sleeping)'));assert.ok(!kit.includes('ball(eye,m.black'));
console.log('PASS: shared symmetric face landmarks, eyes above nose above smile, open/sleep atlas, single registered surface');
