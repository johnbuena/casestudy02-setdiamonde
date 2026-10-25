import fs from 'node:fs';
import * as THREE from 'three';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS,KHRMaterialsClearcoat,KHRMaterialsIOR,KHRMaterialsTransmission} from '@gltf-transform/extensions';
import {meshopt,prune} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptDecoder} from 'meshoptimizer';
import {createOpticalDiamond} from '../src/luxury-surfaces.js';
await MeshoptEncoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const doc=await io.read(process.argv[2] || '/Users/reyco/Downloads/eyewear-prongfree-original.glb'),root=doc.getRoot(),scene=root.listScenes()[0],buffer=root.listBuffers()[0];
const ior=doc.createExtension(KHRMaterialsIOR),transmission=doc.createExtension(KHRMaterialsTransmission),clearcoat=doc.createExtension(KHRMaterialsClearcoat);
const bodyIds=new Set([0,1,2,4,7,8,17,39,44]);
const nativeMeshes=[...root.listMeshes()],nodes=[...root.listNodes()];
const smooth=(i,name)=>{const b=fs.readFileSync(`/tmp/eyewear-smooth-${i}-${name}.bin`);return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));};
function orient(a,isNormal=false){for(let i=0;i<a.length;i+=3){const [x,y,z]=a.slice(i,i+3);a[i]=z*(isNormal?1:100);a[i+1]=isNormal?y:(y-.16)*100;a[i+2]=-x*(isNormal?1:100);}return a;}
const lensPoints=[3,5].map(i=>orient(nativeMeshes[i].listPrimitives()[0].getAttribute('POSITION').getArray().slice()));
for(let i=0;i<nativeMeshes.length;i++){
 const mesh=nativeMeshes[i];const node=nodes.find(n=>n.getMesh()===mesh);
 if(!bodyIds.has(i)){node?.dispose();mesh.dispose();continue;}
 const p=mesh.listPrimitives()[0];p.getAttribute('POSITION').setArray(orient(smooth(i,'positions')));p.getAttribute('NORMAL').setArray(orient(smooth(i,'normals'),true));
 const m=p.getMaterial();m.setName('Polished tortoiseshell acetate').setMetallicFactor(0).setRoughnessFactor(.17).setMetallicRoughnessTexture(null).setNormalTexture(null).setBaseColorFactor([1,1,1,1]);m.setExtension('KHR_materials_clearcoat',clearcoat.createClearcoat().setClearcoatFactor(1).setClearcoatRoughnessFactor(.07));m.setExtension('KHR_materials_ior',ior.createIOR().setIOR(1.49));node.setName('Acetate component '+i).setExtras({role:'acetate'});
}
function addGeometry(name,geometry,material,extras={}){
 const p=doc.createPrimitive();for(const [name,semantic]of [['position','POSITION'],['normal','NORMAL'],['uv','TEXCOORD_0']]){const attr=geometry.getAttribute(name);if(attr)p.setAttribute(semantic,doc.createAccessor().setType(attr.itemSize===2?'VEC2':'VEC3').setArray(new Float32Array(attr.array)).setBuffer(buffer));}
 if(geometry.index)p.setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(geometry.index.array)).setBuffer(buffer));p.setMaterial(material);const node=doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(p)).setExtras(extras);scene.addChild(node);return node;
}
function hull(points){points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);const lo=[],hi=[];for(const p of points){while(lo.length>1&&cross(lo.at(-2),lo.at(-1),p)<=0)lo.pop();lo.push(p);}for(const p of points.slice().reverse()){while(hi.length>1&&cross(hi.at(-2),hi.at(-1),p)<=0)hi.pop();hi.push(p);}lo.pop();hi.pop();return lo.concat(hi);}
const lensMat=doc.createMaterial('Brown gradient lens — optical approximation').setBaseColorFactor([.12,.065,.035,.7]).setMetallicFactor(0).setRoughnessFactor(.015).setAlphaMode('BLEND').setDoubleSided(true).setExtension('KHR_materials_ior',ior.createIOR().setIOR(1.59)).setExtension('KHR_materials_transmission',transmission.createTransmission().setTransmissionFactor(.65));
for(let i=0;i<lensPoints.length;i++){
 const a=lensPoints[i],pts=[];for(let k=0;k<a.length;k+=3)pts.push([a[k],a[k+1]]);const outline=hull(pts),shape=new THREE.Shape();outline.forEach(([x,y],k)=>k?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const g=new THREE.ShapeGeometry(shape,48),p=g.attributes.position;const cx=outline.reduce((s,p)=>s+p[0],0)/outline.length;
 for(let k=0;k<p.count;k++){const x=p.getX(k),y=p.getY(k);p.setZ(k,41.15-.0015*((x-cx)**2+y*y));}g.computeVertexNormals();addGeometry('Optical lens '+i,g,lensMat,{role:'lens'});
}
const gold=doc.createMaterial('Polished champagne metal').setBaseColorFactor([.82,.68,.46,1]).setMetallicFactor(1).setRoughnessFactor(.14);
const diamond=doc.createMaterial('Dielectric brilliant-cut diamond').setBaseColorFactor([1,1,1,1]).setMetallicFactor(0).setRoughnessFactor(0).setExtension('KHR_materials_ior',ior.createIOR().setIOR(2.417)).setExtension('KHR_materials_transmission',transmission.createTransmission().setTransmissionFactor(1));
function rounded(w,h,r){const s=new THREE.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);return s;}
const inset=doc.createMaterial('Polished black temple inset').setBaseColorFactor([.004,.003,.002,1]).setMetallicFactor(.25).setRoughnessFactor(.14);
function tapered(side,inset=0){const s=new THREE.Shape();const x=v=>v*side;s.moveTo(x(-16+inset),-2.8+inset);s.lineTo(x(11),-2.35+inset);s.quadraticCurveTo(x(15-inset),-1.9+inset,x(17-inset),0);s.quadraticCurveTo(x(15-inset),1.9-inset,x(11),2.35-inset);s.lineTo(x(-16+inset),2.8-inset);s.closePath();return s;}
const backing=doc.createMaterial('Polished espresso acetate backing').setBaseColorFactor([.035,.012,.004,1]).setMetallicFactor(0).setRoughnessFactor(.18).setExtension('KHR_materials_clearcoat',clearcoat.createClearcoat().setClearcoatFactor(.7).setClearcoatRoughnessFactor(.06));
for(const side of [-1,1]){
 const u=new THREE.Vector3(.1,-.05*side,-side).normalize(),v=new THREE.Vector3(0,1,-.05).normalize(),n=new THREE.Vector3().crossVectors(u,v).normalize();v.crossVectors(n,u).normalize();const center=new THREE.Vector3(side*47.5,9.1,18);const matrix=new THREE.Matrix4().makeBasis(u,v,n);matrix.setPosition(center);
 // Close the reconstruction's inner inset opening with a solid acetate backing.
 const backingMatrix=matrix.clone();backingMatrix.setPosition(center.clone().addScaledVector(n,-2.7));
 const back=new THREE.ExtrudeGeometry(rounded(33,6.2,1.7),{depth:1,bevelEnabled:true,bevelSize:.2,bevelThickness:.2,bevelSegments:3,curveSegments:32});back.applyMatrix4(backingMatrix);addGeometry('Inner temple acetate backing '+side,back,backing,{role:'backing'});
 const connection=new THREE.ExtrudeGeometry(rounded(5.8,5.7,1.6),{depth:1.5,bevelEnabled:true,bevelSize:.2,bevelThickness:.2,bevelSegments:4});const connectionMatrix=matrix.clone();connectionMatrix.setPosition(new THREE.Vector3(side*43.5,9.5,36));connection.applyMatrix4(connectionMatrix);addGeometry('Acetate hinge bridge '+side,connection,backing,{role:'backing'});
 const hinge=new THREE.ExtrudeGeometry(rounded(2.2,6.7,1.05),{depth:.65,bevelEnabled:true,bevelSize:.22,bevelThickness:.22,bevelSegments:6,curveSegments:48});const hingeMatrix=matrix.clone();hingeMatrix.setPosition(center.clone().addScaledVector(u,-16.6*side).addScaledVector(n,.5));hinge.applyMatrix4(hingeMatrix);addGeometry('Oval polished hinge detail '+side,hinge,gold,{role:'metal'});
 const shape=tapered(side,.22);for(let i=0;i<7;i++){const h=new THREE.Path();h.absarc((i-3)*4.15,0,1.51,0,Math.PI*2,true);shape.holes.push(h);}
 const plate=new THREE.ExtrudeGeometry(shape,{depth:.55,bevelEnabled:true,bevelSize:.04,bevelThickness:.04,bevelSegments:3,curveSegments:64});plate.applyMatrix4(matrix);addGeometry('Dark concealed-retention temple inset '+side,plate,inset,{role:'metal'});
 const border=tapered(side);border.holes.push(new THREE.Path(tapered(side,.25).getPoints(48)));const rim=new THREE.ExtrudeGeometry(border,{depth:.65,bevelEnabled:true,bevelSize:.06,bevelThickness:.06,bevelSegments:3,curveSegments:64});rim.applyMatrix4(matrix);addGeometry('Slender tapered champagne outline '+side,rim,gold,{role:'metal'});
 for(let i=0;i<7;i++){const radius=1.5,c=center.clone().addScaledVector(u,(i-3)*4.15).addScaledVector(n,.61);const stone=createOpticalDiamond(null,1),g=stone.geometry;g.scale(radius,radius,radius);const m=matrix.clone();m.setPosition(c);g.applyMatrix4(m);addGeometry('Independent temple diamond '+side+' '+i,g,diamond,{diamond:{radius,center:c.toArray(),normal:n.toArray()}});stone.material.dispose();}
}
await doc.transform(prune(),meshopt({encoder:MeshoptEncoder,level:'high',quantizePosition:16,quantizeNormal:12,quantizeTexcoord:16}));
await io.write('public/models/eyewear-optical-v1.glb',doc);
console.log('Prepared',root.listMeshes().length,'meshes and',root.listTextures().length,'textures');
