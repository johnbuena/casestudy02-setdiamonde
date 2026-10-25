import * as THREE from 'three';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
import {ConvexGeometry} from 'three/addons/geometries/ConvexGeometry.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// Separate optical surfaces: no photographed highlights painted onto the gemstones.
export async function createJewelleryStudio(renderer){
 const hdri=await new RGBELoader().loadAsync('/environments/studio-small-09-2k.hdr');
 hdri.mapping=THREE.EquirectangularReflectionMapping;
 const cube=new THREE.WebGLCubeRenderTarget(512,{type:THREE.HalfFloatType});const room=new THREE.Scene();room.background=hdri;room.backgroundRotation.y=Math.PI/2;new THREE.CubeCamera(.1,500,cube).update(renderer,room);
 const pmrem=new THREE.PMREMGenerator(renderer);const env=pmrem.fromCubemap(cube.texture);pmrem.dispose();hdri.dispose();
 return {texture:env.texture,cube:cube.texture,dispose(){env.dispose();cube.dispose();}};
}
export function polishedMetal(roughness=.13){return new THREE.MeshPhysicalMaterial({name:'Polished white precious metal',color:0xe8e6e2,metalness:1,roughness,clearcoat:.4,clearcoatRoughness:.08,envMapIntensity:1.05});}


// Fine directional grain follows object space, so the finish stays fixed while orbiting.
function brushedMetal(roughness,band=false){
 const m=polishedMetal(roughness);m.name=band?'Longitudinal satin-brushed bracelet':'Fine satin-brushed bezel';m.clearcoat=.08;m.clearcoatRoughness=.3;m.envMapIntensity=.9;
 m.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 brushPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nbrushPosition=position;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 brushPosition;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   float along=${band?'atan(brushPosition.y,brushPosition.z)*35.':'brushPosition.y'};
   float phase=brushPosition.x*110.+.3*sin(along*1.7)+.18*sin(along*6.1);
   float grain=.5+.32*sin(phase)*exp(-.6*fwidth(phase))+.18*sin(phase*2.37)*exp(-1.2*fwidth(phase));
   roughnessFactor=clamp(roughnessFactor+(grain-.5)*.065,.12,.65);
   diffuseColor.rgb*=.94+.06*grain;`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   vec3 bx=dFdx(-vViewPosition),by=dFdy(-vViewPosition);
   vec3 sx=cross(by,normal),sy=cross(normal,bx);float determinant=dot(bx,sx);
   float microHeight=(grain-.5)*.00035;
   if(abs(determinant)>.0000001)normal=normalize(normal-(sx*dFdx(microHeight)+sy*dFdy(microHeight))/determinant);`);
 };
 m.customProgramCacheKey=()=>`satin-grain-${band}`;return m;
}

function brilliantCut(){
 const points=[];
 for(const [n,r,z,offset]of [[1,0,-.82,0],[16,1,0,0],[16,1,.025,0],[8,.56,.34,Math.PI/8]]){
 for(let i=0;i<n;i++){const a=i*Math.PI*2/n+offset;points.push(new THREE.Vector3(r*Math.cos(a),r*Math.sin(a),z));}}
 const geometry=new ConvexGeometry(points),p=geometry.attributes.position,n=geometry.attributes.normal,planes=[];
 for(let i=0;i<p.count;i+=3){const normal=new THREE.Vector3().fromBufferAttribute(n,i);const d=normal.dot(new THREE.Vector3().fromBufferAttribute(p,i));if(!planes.some(q=>q.x*normal.x+q.y*normal.y+q.z*normal.z>.99999&&Math.abs(q.w-d)<.0001))planes.push(new THREE.Vector4(normal.x,normal.y,normal.z,d));}
 return {geometry,planes};
}
const cut=brilliantCut();
export function createOpticalDiamond(environment,radius,whiteSheen=0){
 const material=new THREE.ShaderMaterial({name:'Faceted dielectric diamond',uniforms:{whiteSheen:{value:whiteSheen},environment:{value:environment},cameraLocal:{value:new THREE.Vector3()},planes:{value:cut.planes}},vertexShader:`varying vec3 pLocal;varying vec3 nLocal;void main(){pLocal=position;nLocal=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`
 precision highp float;
 uniform samplerCube environment;uniform float whiteSheen;uniform vec3 cameraLocal;uniform mat4 modelMatrix;uniform vec4 planes[${cut.planes.length}];varying vec3 pLocal;varying vec3 nLocal;
 vec3 light(vec3 d){return textureCube(environment,normalize(mat3(modelMatrix)*d)).rgb;}
 void main(){vec3 normal=normalize(nLocal),incident=normalize(pLocal-cameraLocal);float cosI=clamp(dot(-incident,normal),0.,1.);float fresnel=.172+.828*pow(1.-cosI,5.);vec3 result=light(reflect(incident,normal))*fresnel;
 vec3 d=refract(incident,normal,1./2.417),p=pLocal+d*.0002;float weight=1.-fresnel;
 for(int bounce=0;bounce<5;bounce++){
 float dist=1e5;vec3 n=vec3(0.,0.,1.);
 for(int i=0;i<${cut.planes.length};i++){vec4 plane=planes[i];float denom=dot(d,plane.xyz);if(denom>.00001){float t=(plane.w-dot(p,plane.xyz))/denom;if(t>.00001&&t<dist){dist=t;n=plane.xyz;}}}
 if(dist>1e4){result+=light(d)*weight;break;}
 p+=d*dist;vec3 escape=refract(d,-n,2.417);
 if(dot(escape,escape)>.001){float f=.172+.828*pow(1.-abs(dot(d,n)),5.);vec3 red=refract(d,-n,2.405),blue=refract(d,-n,2.435);result+=vec3(light(red).r,light(escape).g,light(blue).b)*weight*(1.-f);weight*=f;}
 d=reflect(d,n);p+=d*.0002;weight*=.994;
 }
 result+=light(d)*weight*.35;result=mix(result,vec3(1.),whiteSheen*(.35+.65*pow(1.-cosI,2.)));gl_FragColor=vec4(result,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const mesh=new THREE.Mesh(cut.geometry.clone(),material);mesh.scale.setScalar(radius);mesh.name='Brilliant-cut diamond — independent optical surface';const inverse=new THREE.Matrix4(),local=new THREE.Vector3();mesh.onBeforeRender=(r,s,c)=>{inverse.copy(mesh.matrixWorld).invert();c.getWorldPosition(local).applyMatrix4(inverse);material.uniforms.cameraLocal.value.copy(local);};return mesh;
}
function disc(radius,depth,material,z){const g=new THREE.CylinderGeometry(radius,radius,depth,192);g.rotateX(Math.PI/2);const m=new THREE.Mesh(g,material);m.position.z=z;return m;}
function ring(inner,outer,depth,z,material){const shape=new THREE.Shape();shape.absarc(0,0,outer,0,Math.PI*2,false);const hole=new THREE.Path();hole.absarc(0,0,inner,0,Math.PI*2,true);shape.holes.push(hole);const g=new THREE.ExtrudeGeometry(shape,{depth,steps:1,curveSegments:192,bevelEnabled:true,bevelSegments:3,bevelSize:.07,bevelThickness:.07});const mesh=new THREE.Mesh(g,material);mesh.position.z=z;return mesh;}
// Revolved profiles keep small shoulders and turned grooves visibly rounded.
function turnedRing(profile,material,name){
 const pts=profile.map(([r,z])=>new THREE.Vector2(r,z));pts.push(pts[0].clone());
 const g=new THREE.LatheGeometry(pts,256);g.rotateX(Math.PI/2);
 const m=new THREE.Mesh(g,material);m.name=name;return m;
}
export function refineWatchSurfaces(model,environment){
 // Bake the image reconstruction into a consistent millimetre-like display frame.
 model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());const scale=80/Math.max(size.x,size.y,size.z);
 const transform=new THREE.Matrix4().makeRotationX(.55).multiply(new THREE.Matrix4().makeScale(scale,scale,scale)).multiply(new THREE.Matrix4().makeTranslation(-center.x,-center.y,-center.z));
 const root=new THREE.Group();root.name='Image-derived bracelet with corrected circular optical assembly';
 const meshes=[];model.traverse(m=>{if(m.isMesh)meshes.push(m);});
 for(const mesh of meshes){const g=mesh.geometry;
 for(const name of ['position','normal']){const a=g.getAttribute(name);if(!a)continue;const values=new Float32Array(a.count*3);for(let i=0;i<a.count;i++){values[i*3]=a.getX(i);values[i*3+1]=a.getY(i);values[i*3+2]=a.getZ(i);}g.setAttribute(name,new THREE.BufferAttribute(values,3));}
 g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(transform,mesh.matrixWorld));const p=g.attributes.position,idx=g.index,kept=[];
 // Remove the fused, uneven front assembly rather than overlaying the old dial.
 for(let i=0;i<(idx?idx.count:p.count);i+=3){const ids=[0,1,2].map(k=>idx?idx.getX(i+k):i+k);let remove=false;for(const v of ids){const x=p.getX(v)+1.1,y=p.getY(v);if(p.getZ(v)>28.1&&Math.hypot(x,y)<26.3){remove=true;break;}}if(!remove)kept.push(...ids);}
 // Crown each link across its width, keeping the reconstructed seams and articulation.
 const normals=g.attributes.normal;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i)+1.3,y=p.getY(i),z=p.getZ(i),length=Math.hypot(y,z);
  if((Math.abs(y)<28&&z>14)||length<30||Math.abs(x)>12)continue;
  const ry=y/length,rz=z/length,outward=Math.max(0,normals.getY(i)*ry+normals.getZ(i)*rz);
  const center=Math.abs(x)<4.6,mid=center?0:Math.sign(x)*8.1,half=center?4.6:3.5,t=(x-mid)/half;
  if(Math.abs(t)>=1)continue;
  const amplitude=center?.48:.32,falloff=outward*outward;
  const lift=amplitude*Math.cos(t*Math.PI/2)**2*falloff;
  p.setXYZ(i,p.getX(i),y+ry*lift,z+rz*lift);
  const slope=-amplitude*Math.PI/(2*half)*Math.sin(Math.PI*t)*falloff;
  const n=new THREE.Vector3(normals.getX(i)-slope*outward,normals.getY(i),normals.getZ(i)).normalize();normals.setXYZ(i,n.x,n.y,n.z);
 }
 const buckets=[[],[],[]];for(let i=0;i<kept.length;i+=3){let x=0,y=0,z=0;for(let k=0;k<3;k++){const v=kept[i+k];x+=p.getX(v)/3;y+=p.getY(v)/3;z+=p.getZ(v)/3;}const band=(Math.abs(y)>28||z<14)&&Math.abs(x+1.3)<12;const slot=band?(Math.abs(x+1.3)<4.6?1:2):0;buckets[slot].push(kept[i],kept[i+1],kept[i+2]);}
 g.clearGroups();let offset=0;for(let i=0;i<3;i++){g.addGroup(offset,buckets[i].length,i);offset+=buckets[i].length;}g.setIndex(buckets.flat());g.computeBoundingBox();g.computeBoundingSphere();mesh.removeFromParent();mesh.position.set(0,0,0);mesh.rotation.set(0,0,0);mesh.scale.set(1,1,1);
 // The reconstruction's color/roughness maps contain baked glare and scratches.
 // Retain its case/link geometry, but give the exposed metal a uniform polish.
 const old=mesh.material;Object.values(old).forEach(v=>{if(v?.isTexture)v.dispose();});old.dispose();mesh.material=[polishedMetal(.16),brushedMetal(.24,true),brushedMetal(.33,true)];root.add(mesh);
 }
 const face=new THREE.Group();face.position.x=-1.1;root.add(face);const metal=polishedMetal(.1);
 // A shallow crowned deck over a curved shoulder, instead of a thick flat slab.
 const bezel=new THREE.Shape();bezel.absarc(0,0,26.08,0,Math.PI*2,false);const centerHole=new THREE.Path();centerHole.absarc(0,0,20.55,0,Math.PI*2,true);bezel.holes.push(centerHole);
 const count=30,orbit=23.35,radius=2.04;
 for(let i=0;i<count;i++){
  const a=i*Math.PI*2/count,x=orbit*Math.cos(a),y=orbit*Math.sin(a);
  const hole=new THREE.Path();hole.absarc(x,y,2.17,0,Math.PI*2,true);bezel.holes.push(hole);
  const gem=createOpticalDiamond(environment,radius,.10);gem.position.set(x,y,32.15);gem.rotation.z=a;face.add(gem);
  // A turned relief channel is below the girdle: no prongs or overlap of the crown.
  const seat=turnedRing([[2.045,31.68],[2.045,31.97],[2.075,32.01],[2.115,32.01],[2.15,31.94],[2.18,31.72]],metal,'Recessed polished diamond-seat groove');seat.position.set(x,y,0);face.add(seat);
 }
 const geometry=new THREE.ExtrudeGeometry(bezel,{depth:1.45,steps:2,curveSegments:128,bevelEnabled:true,bevelSegments:5,bevelSize:.11,bevelThickness:.14});
 const deck=geometry.attributes.position;for(let i=0;i<deck.count;i++){const r=Math.hypot(deck.getX(i),deck.getY(i));const crown=.17*Math.max(0,1-((r-orbit)/2.75)**2);deck.setZ(i,deck.getZ(i)+crown);}
 geometry.computeVertexNormals();const body=new THREE.Mesh(geometry,brushedMetal(.34));body.position.z=30.15;body.name='Slim crowned circular bezel with thirty recessed stone seats';face.add(body);
 face.add(turnedRing([[20.45,24.5],[25.55,24.5],[25.90,25.0],[26.18,26.2],[26.30,27.65],[26.30,28.10],[26.20,28.35],[26.06,28.65],[26.06,29.12],[25.98,29.38],[25.82,29.60],[25.82,29.76],[25.98,29.88],[26.05,30.05],[26.02,30.22],[25.90,30.33],[20.45,30.33]],metal,'Rounded bezel shoulder and recessed perimeter seam'));
 face.add(turnedRing([[20.12,31.62],[20.12,32.13],[20.17,32.26],[20.25,32.31],[20.39,32.31],[20.51,32.25],[20.60,32.10],[20.60,31.62]],metal,'Elevated polished inner bezel ring'));
 const handsMetal=polishedMetal(.1),inlayMetal=brushedMetal(.3);inlayMetal.metalness=.65;inlayMetal.color.set(0xdde0df);const accent=new THREE.MeshStandardMaterial({name:'Rhodium inset contrast',color:0x6f757b,metalness:.85,roughness:.28});
 const dialMaterial=new THREE.MeshPhysicalMaterial({name:'Black lacquer dial',color:0x090c10,metalness:.25,roughness:.28,clearcoat:.65,clearcoatRoughness:.15});face.add(disc(20.35,.2,dialMaterial,30.15));
 // Fine radial brushing is geometry: it does not carry baked specular reflections.
 const lines=[];for(let i=0;i<1080;i++){const a=i*Math.PI*2/1080;lines.push(.6*Math.cos(a),.6*Math.sin(a),30.26,19.6*Math.cos(a),19.6*Math.sin(a),30.26);}const brush=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(lines,3)),new THREE.LineBasicMaterial({color:0x31363e,transparent:true,opacity:.12}));face.add(brush);
 // Applied baton indices: polished chamfers around an inset satin face.
 for(let i=0;i<60;i++){
  const a=i*Math.PI*2/60,hour=i%5===0;
  if(!hour){const tick=new THREE.Mesh(new RoundedBoxGeometry(.10,.58,.05,2,.025),handsMetal);tick.position.set(19.25*Math.sin(a),19.25*Math.cos(a),30.33);tick.rotation.z=-a;face.add(tick);continue;}
  const marker=new THREE.Group();marker.name='Applied bevelled hour marker';marker.position.set(17.7*Math.sin(a),17.7*Math.cos(a),30.48);marker.rotation.z=-a;
  const width=i===0?1.18:.9,length=i===0?3.45:3.15;
  const surround=new THREE.Mesh(new RoundedBoxGeometry(width,length,.28,4,.12),handsMetal);marker.add(surround);
  const inset=new THREE.Mesh(new RoundedBoxGeometry(width*.49,length-.45,.055,3,.025),inlayMetal);inset.position.z=.151;marker.add(inset);
  for(const x of [-width*.34,width*.34]){const edge=new THREE.Mesh(new RoundedBoxGeometry(.045,length-.4,.025,2,.01),accent);edge.position.set(x,0,.153);marker.add(edge);}face.add(marker);
 }
 // Tapered sword hands, faceted borders and narrow recessed centre strips.
 function sword(angle,len,width,z){
  const group=new THREE.Group();group.name='Faceted sword hand';group.rotation.z=-angle;group.position.z=z;
  const shape=new THREE.Shape();shape.moveTo(-width*.33,-1.35);shape.lineTo(-width*.5,1.4);shape.lineTo(-width*.32,len-1);shape.lineTo(0,len);shape.lineTo(width*.32,len-1);shape.lineTo(width*.5,1.4);shape.lineTo(width*.33,-1.35);shape.closePath();
  const g=new THREE.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:true,bevelThickness:.065,bevelSize:.065,bevelSegments:2});group.add(new THREE.Mesh(g,handsMetal));
  const strip=new THREE.Mesh(new RoundedBoxGeometry(width*.23,len-2.4,.025,3,.01),inlayMetal);strip.position.set(0,(len-1)/2,.19);group.add(strip);face.add(group);
 }
 sword(-Math.PI/3,11.5,1.08,30.82);sword(Math.PI/3,16,.74,31.14);
 const second=new THREE.Group();second.rotation.z=-Math.PI*1.21;second.position.z=31.55;second.name='Fine seconds hand and counterweight';
 const needle=new THREE.Mesh(new RoundedBoxGeometry(.105,21,.06,2,.025),handsMetal);needle.position.y=7.8;second.add(needle);
 const counter=disc(.37,.08,metal,0);counter.position.y=-2.5;second.add(counter);face.add(second);
 face.add(disc(.78,.17,metal,31.63));face.add(disc(.47,.06,inlayMetal,31.75));face.add(disc(.15,.04,metal,31.79));
 // Thin parallel crystal: Fresnel reflections over an unblurred view of the dial.
 const crystalMaterial=new THREE.ShaderMaterial({name:'Sapphire optical crystal',transparent:true,depthWrite:false,uniforms:{environment:{value:environment}},vertexShader:`varying vec3 worldPosition;varying vec3 worldNormal;void main(){worldPosition=(modelMatrix*vec4(position,1.)).xyz;worldNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform samplerCube environment;varying vec3 worldPosition;varying vec3 worldNormal;void main(){vec3 v=normalize(cameraPosition-worldPosition);vec3 n=normalize(worldNormal);float f=.0758+.9242*pow(1.-max(dot(v,n),0.),5.);vec3 color=textureCube(environment,reflect(-v,n)).rgb;gl_FragColor=vec4(color,f);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const crystal=disc(20.18,.18,crystalMaterial,31.98);crystal.name='Separate sapphire-like crystal';face.add(crystal);
 return {root,crystal};
}

// Smooth turned surfaces for the illustrative cutaway; no reconstruction ripples.
export function machinedSection(profile){
 const start=.42,length=Math.PI*2-.84;
 const points=profile.map(([r,z])=>new THREE.Vector2(r,z));points.push(points[0].clone());
 const lathe=new THREE.LatheGeometry(points,256,start,length).toNonIndexed();lathe.rotateX(Math.PI/2);
 const vertices=Array.from(lathe.attributes.position.array),normals=Array.from(lathe.attributes.normal.array);
 const triangles=THREE.ShapeUtils.triangulateShape(points.slice(0,-1),[]);
 for(const [angle,sign]of [[start,-1],[start+length,1]]){const normal=new THREE.Vector3(Math.cos(angle)*sign,Math.sin(angle)*sign,0);for(const triangle of triangles){const v=triangle.map(i=>{const [r,z]=profile[i];return new THREE.Vector3(r*Math.sin(angle),-r*Math.cos(angle),z);});if(new THREE.Vector3().subVectors(v[1],v[0]).cross(new THREE.Vector3().subVectors(v[2],v[0])).dot(normal)<0)v.reverse();for(const p of v){vertices.push(p.x,p.y,p.z);normals.push(normal.x,normal.y,normal.z);}}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));lathe.dispose();return g;
}
