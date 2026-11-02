'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');const source=fs.readFileSync(path.join(root,'assets/ck-full-exam-v82.js'),'utf8');
test('v95 historical results and text-export are parseable',()=>{new vm.Script(source);assert.match(source,/function makeResultText/);assert.match(source,/data-ck82-history-select/);assert.match(source,/data-ck82-export/);assert.match(source,/expiryRetryAt/);});
test('v95 no automatic deployment or Actions',()=>{const v=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8'));assert.equal(v.git.deploymentEnabled,false);assert.equal(fs.existsSync(path.join(root,'.github/workflows')),false);});
