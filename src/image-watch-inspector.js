import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {createDetailedSetting} from './setting-materials.js';
import {createJewelleryStudio,refineWatchSurfaces} from './luxury-surfaces.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

// Preserve the image-derived mesh and its supplied texture maps.
export async function mountImageWatchInspector(host,{conventional=false}={}){
 const gltf=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(conventional?'/models/watch-image-v2.glb':'/models/watch-polished-base.glb');
 const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio,1.5),2));renderer.setClearColor(0x1c211f);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.transmissionResolutionScale=1;
 const scene=new THREE.Scene();let env,studio;
 if(conventional){const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();env=pmrem.fromScene(room,.04);room.dispose();pmrem.dispose();scene.environment=env.texture;scene.environmentIntensity=.8;}
 else{studio=await createJewelleryStudio(renderer);scene.environment=studio.texture;scene.environmentIntensity=1;}
 const model=gltf.scene;let group,crystal;
 if(conventional){const bounds=new THREE.Box3().setFromObject(model),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());model.position.sub(center);group=new THREE.Group();group.add(model);group.scale.setScalar(80/Math.max(size.x,size.y,size.z));group.rotation.x=Math.PI/2;}
 else{const refined=refineWatchSurfaces(model,studio.cube);group=refined.root;crystal=refined.crystal;}
 scene.add(group);
 const setting=conventional?null:await createDetailedSetting(studio.cube);if(setting){setting.root.visible=false;scene.add(setting.root);}
 const camera=new THREE.PerspectiveCamera(35,1,.1,1000);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=15;controls.maxDistance=280;controls.autoRotateSpeed=.6;
 const key=new THREE.DirectionalLight(0xffffff,2);key.position.set(40,65,90);scene.add(key);const fill=new THREE.DirectionalLight(0xe5edff,.65);fill.position.set(-50,0,-30);scene.add(fill);
 const views={overview:{p:[65,35,145],t:[0,0,0]},front:{p:[-1.1,0,155],t:[-1.1,0,30]},bezel:{p:[8,-38,65],t:[0,-20,31]},crown:{p:[155,0,30],t:[0,0,0]},back:{p:[65,30,-145],t:[0,0,0]},setting:{p:[-16,-50,20],t:[0,0,1]}};
 let separation=0;
 function view(name){const specimen=name==='setting'&&setting;group.visible=!specimen;if(setting)setting.root.visible=!!specimen;camera.up.set(0,specimen?0:1,specimen?1:0);controls.minDistance=specimen?4:15;controls.maxDistance=specimen?65:280;const v=views[name]||views.overview;camera.position.set(...v.p);controls.target.set(...v.t);if(specimen){camera.position.z+=separation*6;controls.target.z+=separation*6;}controls.update();renderer.render(scene,camera);}
 let visible=true,disposed=false;host.replaceChildren(renderer.domElement);const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};const ro=new ResizeObserver(resize);ro.observe(host);const io=new IntersectionObserver(([e])=>visible=e.isIntersecting);io.observe(host);resize();view('overview');
 function loop(){if(disposed)return;requestAnimationFrame(loop);if(visible&&!document.hidden){controls.update();renderer.render(scene,camera);}}loop();
 return {view,crystal(v){if(crystal)crystal.visible=v;},exploded(value){if(!setting)return;const next=Number(value)/100;const shift=(next-separation)*6;setting.exploded(value);if(setting.root.visible){camera.position.z+=shift;controls.target.z+=shift;}separation=next;controls.update();renderer.render(scene,camera);},rotate(v){controls.autoRotate=v;},lighting(warm){key.color.set(warm?0xffd8a8:0xffffff);},dispose(){disposed=true;ro.disconnect();io.disconnect();controls.dispose();const geometries=new Set(),materials=new Set(),textures=new Set();scene.traverse(x=>{if(x.geometry)geometries.add(x.geometry);for(const m of x.material?(Array.isArray(x.material)?x.material:[x.material]):[]){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});geometries.forEach(x=>x.dispose());textures.forEach(x=>x.dispose());materials.forEach(x=>x.dispose());env?.dispose();studio?.dispose();renderer.dispose();}};
}
