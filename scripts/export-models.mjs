import {writeFile} from 'node:fs/promises';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {watch,sunglasses,bracelet} from '../src/models.js';
globalThis.FileReader=class {readAsArrayBuffer(blob){blob.arrayBuffer().then(x=>{this.result=x;this.onloadend?.();});}readAsDataURL(blob){blob.arrayBuffer().then(x=>{this.result='data:'+blob.type+';base64,'+Buffer.from(x).toString('base64');this.onloadend?.();});}};
for(const [name,make] of [['watch',watch],['sunglasses',sunglasses],['bracelet',bracelet]]){const model=make();model.traverse(x=>{if(x.isMesh&&x.material.map){x.material=x.material.clone();x.material.map=null;x.material.color.set(0x5b3018);}});const output=await new GLTFExporter().parseAsync(model,{binary:true});await writeFile('public/models/'+name+'.glb',Buffer.from(output));console.log(name,output.byteLength);}
