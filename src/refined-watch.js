import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// Original demonstration geometry. Dimensions are illustrative millimetres,
// not SetDiamonde production specifications or a reverse-engineered mechanism.
export const WATCH_SPEC={caseDiameter:40,stoneCount:44,stoneDiameter:2.12,units:'illustrative millimetres'};
const TAU=Math.PI*2;
export function createMaterials(){
 const satin=new THREE.MeshPhysicalMaterial({name:'Satin platinum-tone steel',color:0xbec2c5,metalness:1,roughness:.29,clearcoat:.15});
 const polish=new THREE.MeshPhysicalMaterial({name:'Polished bevels',color:0xe5e7e8,metalness:1,roughness:.12});
 const recess=new THREE.MeshStandardMaterial({name:'Dark assembly seams',color:0x292e30,metalness:.85,roughness:.35});
 const dial=new THREE.MeshPhysicalMaterial({name:'Charcoal sunray dial',color:0x151b1e,metalness:.75,roughness:.31});
 const gem=new THREE.MeshPhysicalMaterial({name:'Diamond optical appearance — illustrative',color:0xffffff,metalness:0,roughness:.015,transmission:.35,thickness:1.2,ior:2.417,dispersion:.06,envMapIntensity:2.0,clearcoat:1,clearcoatRoughness:0,side:THREE.DoubleSide});
 const glass=new THREE.MeshPhysicalMaterial({name:'Transparent watch crystal',color:0xffffff,roughness:.02,metalness:0,transmission:1,ior:1.52,thickness:.35,transparent:true,opacity:.22,depthWrite:false});
 return {satin,polish,recess,dial,gem,glass};
}
function part(geometry,material,name,position=[0,0,0]){const m=new THREE.Mesh(geometry,material);m.name=name;m.position.set(...position);m.castShadow=true;m.receiveShadow=true;return m;}
function disc(r,h,material,name,z=0){const m=part(new THREE.CylinderGeometry(r,r,h,96),material,name,[0,0,z]);m.rotation.x=Math.PI/2;return m;}
function torus(r,tube,material,name,z=0,arc=TAU){return part(new THREE.TorusGeometry(r,tube,12,96,arc),material,name,[0,0,z]);}
function lathe(profile,material,name,segments=96,arc=TAU){const geo=new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),segments,0,arc);geo.rotateX(Math.PI/2);return part(geo,material,name);}
function plate(outer,inner,depth,mat,name,z,holes=[]){const s=new THREE.Shape();s.absarc(0,0,outer,0,TAU,false);if(inner){const p=new THREE.Path();p.absarc(0,0,inner,0,TAU,true);s.holes.push(p);}for(const [x,y,r]of holes){const h=new THREE.Path();h.absarc(x,y,r,0,TAU,true);s.holes.push(h);}return part(new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:.055,bevelThickness:.055,bevelSegments:2,steps:1,curveSegments:96}),mat,name,[0,0,z]);}

// Discrete planar crown, girdle, pavilion and table facets; no sphere substitutes.
export function brilliantGeometry(radius=1.06){
 const p=[];const rings=[{n:8,r:.015,z:-.71},{n:8,r:.62,z:-.32},{n:16,r:1,z:0},{n:16,r:1,z:.025},{n:8,r:.56,z:.49}];
 function at(r,i){const a=TAU*i/r.n;return [Math.cos(a)*r.r*radius,Math.sin(a)*r.r*radius,r.z*radius];}
 function tri(a,b,c){p.push(...a,...b,...c);}
 for(let k=0;k<rings.length-1;k++){const a=rings[k],b=rings[k+1];if(a.n===b.n){for(let i=0;i<a.n;i++){const j=(i+1)%a.n;tri(at(a,i),at(a,j),at(b,i));tri(at(a,j),at(b,j),at(b,i));}}else if(a.n<b.n){for(let i=0;i<a.n;i++){const j=(i+1)%a.n;tri(at(a,i),at(a,j),at(b,2*i+1));tri(at(a,i),at(b,2*i+1),at(b,2*i));tri(at(a,j),at(b,2*j),at(b,2*i+1));}}else{for(let i=0;i<b.n;i++){const j=(i+1)%b.n;tri(at(a,2*i),at(a,2*i+1),at(b,i));tri(at(a,2*i+1),at(b,j),at(b,i));tri(at(a,2*i+1),at(a,2*j),at(b,j));}}}
 const top=rings.at(-1);for(let i=0;i<8;i++)tri([0,0,top.z*radius],at(top,i),at(top,(i+1)%8));
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();return g;
}
function sleeveGeometry(){return new THREE.LatheGeometry([new THREE.Vector2(.62,-1.25),new THREE.Vector2(.8,-1.25),new THREE.Vector2(.82,-.65),new THREE.Vector2(1.04,-.12),new THREE.Vector2(1.035,-.055),new THREE.Vector2(.96,-.055),new THREE.Vector2(.73,-.64),new THREE.Vector2(.62,-1.25)],32).rotateX(Math.PI/2);}
export function createRefinedWatch(){
 const m=createMaterials();const root=new THREE.Group();root.name='VentVest refined watch — simulated setting demonstration';root.userData={purpose:'Independent original visualization',...WATCH_SPEC,confidentiality:'No proprietary CAD used; retaining construction is simulated',notForManufacture:true};
 const caseGroup=new THREE.Group();caseGroup.name='01 Case and underside';root.add(caseGroup);
 caseGroup.add(lathe([[17,-.6],[18,-.55],[19,-.1],[20,.65],[20,3.6],[19.8,4.5],[19.2,5],[17.3,5],[17,4.6],[17,-.6]],m.satin,'Sculpted case with polished transitions'));
 // Lathe profiles use Z as the watch thickness axis.
 caseGroup.add(torus(19.8,.18,m.polish,'Upper case polished bevel',4.4),torus(18.7,.2,m.polish,'Caseback edge',-.65));
 const back=disc(18.3,.65,m.satin,'Closed caseback',-.7);caseGroup.add(back,torus(16.8,.12,m.recess,'Caseback seam',-1.06));
 for(let i=0;i<6;i++){const a=i*TAU/6;const screw=disc(.45,.07,m.polish,'Caseback screw',-1.08);screw.position.x=Math.sin(a)*17.5;screw.position.y=Math.cos(a)*17.5;caseGroup.add(screw);const slot=part(new THREE.BoxGeometry(.5,.075,.03),m.recess,'Screw slot',[screw.position.x,screw.position.y,-1.13]);slot.rotation.z=a;caseGroup.add(slot);}
 // Sculpted lugs and visible spring-bar ends.
 for(const sy of [-1,1])for(const sx of [-1,1]){const lug=part(new RoundedBoxGeometry(3.5,9,4.2,3,.6),m.satin,'Case lug',[sx*8.9,sy*18.8,1.1]);lug.rotation.x=sy*.16;caseGroup.add(lug);const pin=disc(.6,.12,m.polish,'Spring bar end');pin.rotation.y=Math.PI/2;pin.position.set(sx*10.7,sy*21.2,.8);caseGroup.add(pin);}
 const crown=lathe([[0,0],[2.5,0],[2.8,.4],[2.8,3.2],[2.5,3.6],[0,3.6]],m.polish,'Winding crown');crown.rotation.y=Math.PI/2;crown.position.set(19.4,0,2.1);caseGroup.add(crown);
 for(let i=0;i<28;i++){const a=i*TAU/28;const ridge=part(new THREE.CylinderGeometry(.13,.13,2.6,6),m.satin,'Crown knurl',[21.1,Math.cos(a)*2.78,2.1+Math.sin(a)*2.78]);ridge.rotation.z=Math.PI/2;caseGroup.add(ridge);}
 const dial=new THREE.Group();dial.name='02 Dial and hands';root.add(dial);dial.add(disc(16.6,.35,m.dial,'Charcoal dial',5.75),torus(16.55,.17,m.polish,'Inner rehaut',6));
 // Fine physical radial brushing catches studio light without a baked photograph.
 const brushMat=new THREE.LineBasicMaterial({color:0x718087,transparent:true,opacity:.08});const lines=[];for(let i=0;i<480;i++){const a=i*TAU/480;lines.push(Math.cos(a)*1,Math.sin(a)*1,5.94,Math.cos(a)*15.8,Math.sin(a)*15.8,5.94);}const lineGeo=new THREE.BufferGeometry();lineGeo.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));dial.add(new THREE.LineSegments(lineGeo,brushMat));
 for(let i=0;i<60;i++){const a=i*TAU/60;const marker=part(new THREE.BoxGeometry(i%5===0?.16:.09,i%5===0?.8:.4,.025),m.polish,'Minute track',[Math.sin(a)*15.4,Math.cos(a)*15.4,5.97]);marker.rotation.z=-a;dial.add(marker);}
 for(let i=0;i<12;i++){const a=i*TAU/12;const baton=part(new RoundedBoxGeometry(.62,2.1,.3,2,.08),m.polish,'Applied hour index',[Math.sin(a)*13.4,Math.cos(a)*13.4,6.12]);baton.rotation.z=-a;dial.add(baton);}
 function hand(length,width,angle,z){const s=new THREE.Shape();s.moveTo(-width/2,-1.4);s.lineTo(width/2,-1.4);s.lineTo(width*.32,length*.8);s.lineTo(0,length);s.lineTo(-width*.32,length*.8);s.closePath();const h=part(new THREE.ExtrudeGeometry(s,{depth:.1,bevelEnabled:true,bevelSize:.06,bevelThickness:.04,bevelSegments:1}),m.polish,'Faceted watch hand',[0,0,z]);h.rotation.z=angle;dial.add(h);}
 hand(9.5,.62,.92,6.35);hand(12.3,.42,-1.12,6.58);hand(13.4,.095,2.7,6.8);dial.add(disc(.62,.15,m.polish,'Hand pinion',6.91));
 const crystal=disc(16.35,.24,m.glass,'Crystal',7.15);crystal.renderOrder=4;dial.add(crystal);
 const bezel=new THREE.Group();bezel.name='03 Stone-set bezel';root.add(bezel);const holes=[];for(let i=0;i<44;i++){const a=i*TAU/44;holes.push([Math.sin(a)*18.55,Math.cos(a)*18.55,1.085]);}
 bezel.add(plate(20.2,16.85,1.3,m.satin,'Perforated bezel carrier',5.85,holes),torus(20.2,.11,m.polish,'Outer bezel edge',7.15),torus(16.85,.1,m.polish,'Inner bezel edge',7.15));
 const diamondGeo=brilliantGeometry();const sleeveGeo=sleeveGeometry();
 for(let i=0;i<44;i++){const a=i*TAU/44;const position=[Math.sin(a)*18.55,Math.cos(a)*18.55,7.42];const d=part(diamondGeo,m.gem,'Brilliant-cut diamond '+String(i+1).padStart(2,'0'),position);d.rotation.z=a;bezel.add(d);const sleeve=part(sleeveGeo,m.polish,'Simulated lower retaining sleeve '+(i+1),position);bezel.add(sleeve);}
 const bracelet=new THREE.Group();bracelet.name='04 Curved articulated bracelet';root.add(bracelet);
 const centerGeo=new RoundedBoxGeometry(7.2,3.25,2.5,3,.32);const outerGeo=new RoundedBoxGeometry(4.15,3.05,2.2,3,.3);
 for(const side of [-1,1])for(let i=0;i<11;i++){const a=i*.14;const y=side*(22+22*Math.sin(a));const z=.6-22*(1-Math.cos(a));const g=new THREE.Group();g.name='Bracelet row '+side+' / '+i;g.position.set(0,y,z);g.rotation.x=-side*a;g.add(part(centerGeo,m.polish,'Polished central link'));for(const x of [-6,6])g.add(part(outerGeo,m.satin,'Brushed outer link',[x,0,0]));for(const x of [-8.15,8.15]){const pin=disc(.32,.08,m.polish,'Link pin');pin.rotation.y=Math.PI/2;pin.position.set(x,0,0);g.add(pin);}bracelet.add(g);}
 return {root,materials:m,parts:{caseGroup,dial,bezel,bracelet},crystal};
}
export function createSettingStudy(){const m=createMaterials();const root=new THREE.Group();root.name='Independent simulated lower-retention specimen';const stone=part(brilliantGeometry(4.2),m.gem,'Demonstration diamond',[0,0,4.2]);root.add(stone);
 const insert=new THREE.Group();insert.name='Simulated cup and stepped lower stem';insert.add(lathe([[2,-1.5],[2.7,-1.5],[3.05,-.4],[4,2.8],[3.85,3.05],[3.6,2.8],[2.5,-.7],[2,-.7]],m.polish,'Sectioned lower cup',64,Math.PI*1.45));insert.add(disc(2.4,1.4,m.satin,'Stepped lower shoulder',-2.15),disc(1.55,2.4,m.polish,'Concealed stem',-3.7),disc(2.1,.5,m.satin,'Lower retaining step',-4.85));root.add(insert);
 const carrier=new THREE.Group();carrier.name='Sectioned demonstration carrier';const section=lathe([[2.6,-5.3],[6,-5.3],[6,3],[4.2,3],[4.2,.3],[2.6,.3],[2.6,-5.3]],m.satin,'Sectioned carrier',80,Math.PI*1.45);carrier.add(section);root.add(carrier);root.userData={status:'Simulated mechanism for visual explanation only. No proprietary geometry, tested retention or manufacturing dimensions.'};return {root,stone,insert,carrier,materials:m};}
