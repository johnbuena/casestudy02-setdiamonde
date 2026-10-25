import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {createJewelleryStudio,createOpticalDiamond} from './luxury-surfaces.js';

function gradientLens(environment,minY,maxY){
 return new THREE.ShaderMaterial({name:'Brown gradient optical lens',transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{environment:{value:environment},minY:{value:minY},maxY:{value:maxY}},vertexShader:`varying vec3 worldPosition;varying vec3 worldNormal;void main(){worldPosition=(modelMatrix*vec4(position,1.)).xyz;worldNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform samplerCube environment;uniform float minY,maxY;varying vec3 worldPosition;varying vec3 worldNormal;void main(){vec3 v=normalize(cameraPosition-worldPosition),n=normalize(worldNormal);if(!gl_FrontFacing)n=-n;float height=clamp((worldPosition.y-minY)/(maxY-minY),0.,1.);float f=.052+.948*pow(1.-max(dot(v,n),0.),5.);vec3 reflection=textureCube(environment,reflect(-v,n)).rgb;vec3 tint=mix(vec3(.13,.071,.035),vec3(.016,.012,.011),smoothstep(0.,1.,height));float absorption=mix(.36,.88,height);vec3 color=mix(tint,reflection,f);gl_FragColor=vec4(color,max(absorption,f));
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
}
export async function mountEyewearInspector(host){
 const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
 const gltf=await loader.loadAsync('/models/eyewear-optical-v1.glb');
 const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio,1.5),2));renderer.setClearColor(0x1c211f);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 const studio=await createJewelleryStudio(renderer),scene=new THREE.Scene();scene.environment=studio.texture;
 const root=gltf.scene;scene.add(root);root.updateMatrixWorld(true);const lenses=[],diamonds=[];
 root.traverse(mesh=>{if(!mesh.isMesh)return;
  if(mesh.userData.diamond){diamonds.push(mesh);return;}
  if(mesh.userData.role==='lens'){const box=new THREE.Box3().setFromObject(mesh);mesh.material.dispose();mesh.material=gradientLens(studio.cube,box.min.y,box.max.y);mesh.renderOrder=2;lenses.push(mesh);}
  else if(mesh.userData.role==='acetate'){const old=mesh.material;mesh.material=new THREE.MeshPhysicalMaterial({name:'Polished patterned acetate',map:old.map,color:0xffffff,metalness:0,roughness:.17,clearcoat:.65,clearcoatRoughness:.06,ior:1.49,envMapIntensity:.55});old.dispose();if(mesh.material.map)mesh.material.map.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);}
 });
 for(const old of diamonds){const {radius,center,normal}=old.userData.diamond;const gem=createOpticalDiamond(studio.cube,radius);gem.position.fromArray(center);gem.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3().fromArray(normal));root.add(gem);old.removeFromParent();old.geometry.dispose();old.material.dispose();}
 const key=new THREE.DirectionalLight(0xfff2e3,1.5);key.position.set(40,70,100);scene.add(key);const fill=new THREE.DirectionalLight(0xe6edff,1);fill.position.set(-70,30,25);scene.add(fill);
 const camera=new THREE.PerspectiveCamera(35,1,.1,1000);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=12;controls.maxDistance=400;controls.autoRotateSpeed=.6;
 const views={overview:{p:[110,62,145],t:[0,0,8]},front:{p:[0,8,205],t:[0,0,20]},temple:{p:[108,22,38],t:[47,9,18]},lens:{p:[-15,8,95],t:[-25,0,32]},back:{p:[-90,55,-145],t:[0,0,-10]},side:{p:[205,15,0],t:[0,0,0]}};
 function view(name){const v=views[name]||views.overview;camera.position.set(...v.p);controls.target.set(...v.t);controls.update();renderer.render(scene,camera);}
 let visible=true,disposed=false;host.replaceChildren(renderer.domElement);
 function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.render(scene,camera);}
 const ro=new ResizeObserver(resize);ro.observe(host);const io=new IntersectionObserver(([e])=>visible=e.isIntersecting);io.observe(host);resize();view('overview');
 function loop(){if(disposed)return;requestAnimationFrame(loop);if(visible&&!document.hidden){controls.update();renderer.render(scene,camera);}}loop();
 return {view,rotate(v){controls.autoRotate=v;},lenses(v){lenses.forEach(m=>m.visible=v);renderer.render(scene,camera);},dispose(){disposed=true;ro.disconnect();io.disconnect();controls.dispose();const geometries=new Set(),materials=new Set(),textures=new Set();scene.traverse(m=>{if(m.geometry)geometries.add(m.geometry);if(m.material){materials.add(m.material);Object.values(m.material).forEach(v=>{if(v?.isTexture)textures.add(v);});}});geometries.forEach(x=>x.dispose());materials.forEach(x=>x.dispose());textures.forEach(x=>x.dispose());studio.dispose();renderer.dispose();}};
}
