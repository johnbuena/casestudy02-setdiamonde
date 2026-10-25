import {gzipSync} from 'node:zlib';
import {writeFile} from 'node:fs/promises';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {OBJExporter} from 'three/addons/exporters/OBJExporter.js';
import {createRefinedWatch,createSettingStudy,WATCH_SPEC} from '../src/refined-watch.js';
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(x=>{this.result=x;this.onloadend?.();});}readAsDataURL(blob){blob.arrayBuffer().then(x=>{this.result='data:'+blob.type+';base64,'+Buffer.from(x).toString('base64');this.onloadend?.();});}};
for(const [name,make]of [['watch-refined-v1',createRefinedWatch],['setting-simulation-v1',createSettingStudy]]){const {root}=make();root.updateMatrixWorld(true);const binary=await new GLTFExporter().parseAsync(root,{binary:true});await writeFile('public/models/'+name+'.glb',Buffer.from(binary));console.log(name,binary.byteLength);if(name==='watch-refined-v1')await writeFile('public/models/'+name+'.obj.gz',gzipSync(new OBJExporter().parse(root),{level:9}));}
await writeFile('public/models/watch-refined-v1-spec.json',JSON.stringify({...WATCH_SPEC,status:'Original visualization; not manufacturing CAD, not proprietary SetDiamonde geometry.',generator:'src/refined-watch.js',formats:{glb:'Materials and part names included',obj:'Geometry interchange; materials not included'}},null,2));
