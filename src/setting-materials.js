import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';

// Image-derived illustrative components, independently movable; not production CAD.
export async function createDetailedSetting(){
 const gltf=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync('/models/setting-textured-v1.glb');
 gltf.scene.updateMatrixWorld(true);
 const meshes=[];gltf.scene.traverse(m=>{if(m.isMesh)meshes.push(m);});
 if(meshes.length!==3)throw new Error('Expected three separate setting components');
 // Generation output is Y-up and already separated. Sort by vertical center:
 // carrier, lower insert, diamond. Normalize each around its own center.
 const parts=meshes.map(mesh=>({mesh,box:new THREE.Box3().setFromObject(mesh)})).sort((a,b)=>a.box.getCenter(new THREE.Vector3()).y-b.box.getCenter(new THREE.Vector3()).y);
 const scale=12/parts[0].box.getSize(new THREE.Vector3()).x;
 const root=new THREE.Group();root.name='Illustrative textured lower-retention specimen';
 const names=['Carrier','Lower retaining insert','Diamond'];
 const normalized=parts.map(({mesh},i)=>{
  // Dequantize before transforming: normalized integer attributes cannot store
  // the specimen's millimetre-scale coordinates without clipping.
  for(const name of ['position','normal']){const a=mesh.geometry.getAttribute(name);if(!a)continue;const values=new Float32Array(a.count*3);for(let j=0;j<a.count;j++){values[j*3]=a.getX(j);values[j*3+1]=a.getY(j);values[j*3+2]=a.getZ(j);}mesh.geometry.setAttribute(name,new THREE.BufferAttribute(values,3));}
  mesh.geometry.applyMatrix4(mesh.matrixWorld);mesh.geometry.rotateX(Math.PI/2);mesh.geometry.scale(scale,scale,scale);mesh.geometry.computeBoundingBox();
  const center=mesh.geometry.boundingBox.getCenter(new THREE.Vector3()),size=mesh.geometry.boundingBox.getSize(new THREE.Vector3());mesh.geometry.translate(-center.x,-center.y,-center.z);
  mesh.removeFromParent();mesh.position.set(0,0,0);mesh.rotation.set(0,0,0);mesh.scale.set(1,1,1);mesh.name=names[i];root.add(mesh);return {mesh,height:size.z};
 });
 const [carrier,insert,stone]=normalized;
 const carrierZ=-5+carrier.height/2,insertTop=-5+carrier.height+.4;
 const insertZ=insertTop-insert.height/2,stoneZ=insertTop-stone.height*.2;
 function exploded(value){const x=THREE.MathUtils.clamp(Number(value)/100,0,1);carrier.mesh.position.z=carrierZ-x*1.5;insert.mesh.position.z=insertZ+x*7;stone.mesh.position.z=stoneZ+x*14;}
 exploded(0);
 return {root,exploded};
}
