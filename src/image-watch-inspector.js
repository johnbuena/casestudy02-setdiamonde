import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

// Preserve the image-derived mesh and its supplied texture maps.
export async function mountImageWatchInspector(host){
 const gltf=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync('/models/watch-image-v2.glb');
 const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x1c211f);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 const scene=new THREE.Scene();const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const env=pmrem.fromScene(room,.04);room.dispose();pmrem.dispose();scene.environment=env.texture;scene.environmentIntensity=.8;
 const model=gltf.scene;const bounds=new THREE.Box3().setFromObject(model);const center=bounds.getCenter(new THREE.Vector3());const size=bounds.getSize(new THREE.Vector3());const scale=80/Math.max(size.x,size.y,size.z);model.position.sub(center);const group=new THREE.Group();group.add(model);group.scale.setScalar(scale);group.rotation.x=Math.PI/2;scene.add(group);
 const camera=new THREE.PerspectiveCamera(35,1,.1,1000);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=15;controls.maxDistance=280;controls.autoRotateSpeed=.6;
 const key=new THREE.DirectionalLight(0xffffff,2);key.position.set(40,65,90);scene.add(key);const fill=new THREE.DirectionalLight(0xe5edff,.65);fill.position.set(-50,0,-30);scene.add(fill);
 const views={overview:{p:[65,35,145],t:[0,0,0]},front:{p:[0,0,165],t:[0,0,0]},bezel:{p:[15,-50,65],t:[0,-22,20]},crown:{p:[155,0,30],t:[0,0,0]},back:{p:[65,30,-145],t:[0,0,0]}};
 function view(name){const v=views[name]||views.overview;camera.position.set(...v.p);controls.target.set(...v.t);controls.update();renderer.render(scene,camera);}
 let visible=true,disposed=false;host.replaceChildren(renderer.domElement);const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};const ro=new ResizeObserver(resize);ro.observe(host);const io=new IntersectionObserver(([e])=>visible=e.isIntersecting);io.observe(host);resize();view('overview');
 function loop(){if(disposed)return;requestAnimationFrame(loop);if(visible&&!document.hidden){controls.update();renderer.render(scene,camera);}}loop();
 return {view,rotate(v){controls.autoRotate=v;},lighting(warm){key.color.set(warm?0xffd8a8:0xffffff);},dispose(){disposed=true;ro.disconnect();io.disconnect();controls.dispose();const geometries=new Set(),materials=new Set(),textures=new Set();model.traverse(x=>{if(x.geometry)geometries.add(x.geometry);for(const m of x.material?(Array.isArray(x.material)?x.material:[x.material]):[]){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});geometries.forEach(x=>x.dispose());textures.forEach(x=>x.dispose());materials.forEach(x=>x.dispose());env.dispose();renderer.dispose();}};
}
