import fs from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {refineWatchSurfaces} from '../src/luxury-surfaces.js';
import {createDetailedSetting} from '../src/setting-materials.js';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {meshopt} from '@gltf-transform/functions';
import {MeshoptEncoder} from 'meshoptimizer';
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(x=>{this.result=x;this.onloadend?.();});}};
const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
async function read(path){const b=await fs.readFile(path);return loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}
const watch=refineWatchSurfaces((await read('public/models/watch-polished-base.glb')).scene,null);
const setting=await createDetailedSetting(true,await read('public/models/setting-polished-base.glb'));
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});await MeshoptEncoder.ready;
for(const [name,study]of [['watch-optical-v2',watch],['setting-optical-v2',setting]]){
 study.root.traverse(m=>{if(!m.material?.isShaderMaterial)return;const crystal=m.material.name.includes('Sapphire');m.material=new THREE.MeshPhysicalMaterial({name:crystal?'Sapphire crystal':'Dielectric diamond — viewer-dependent optics',color:0xffffff,metalness:0,roughness:0,transmission:1,ior:crystal?1.76:2.417,thickness:crystal?.45:2,dispersion:crystal?0:.04});});
 const binary=await new GLTFExporter().parseAsync(study.root,{binary:true});const doc=await io.readBinary(new Uint8Array(binary));await doc.transform(meshopt({encoder:MeshoptEncoder,level:'high'}));await io.write('public/models/'+name+'.glb',doc);console.log(name);
}
