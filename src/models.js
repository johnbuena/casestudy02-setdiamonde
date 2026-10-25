import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
const metal=new T.MeshStandardMaterial({color:0xc8c3b8,metalness:1,roughness:.23});
const dark=new T.MeshStandardMaterial({color:0x111815,metalness:.48,roughness:.3});
const gem=new T.MeshPhysicalMaterial({color:0xc9d9dc,metalness:.65,roughness:.12,clearcoat:1,flatShading:true});
const acetate=new T.MeshPhysicalMaterial({color:0x261811,roughness:.19,metalness:.06,clearcoat:1});
const lens=new T.MeshPhysicalMaterial({color:0x3a3026,metalness:.25,roughness:.12,transparent:true,opacity:.88,clearcoat:1});
function mesh(g,m,p=[0,0,0]){const x=new T.Mesh(g,m);x.position.set(...p);x.castShadow=true;x.receiveShadow=true;return x;}
function ring(radius,tube,mat,z=0){return mesh(new T.TorusGeometry(radius,tube,12,96),mat,[0,0,z]);}
function disc(r,d,mat,z=0){const x=mesh(new T.CylinderGeometry(r,r,d,96),mat,[0,0,z]);x.rotation.x=Math.PI/2;return x;}
function diamond(s=.08){const g=new T.Group();const a=mesh(new T.ConeGeometry(s,s*.8,8),gem,[0,0,-s*.25]);a.rotation.x=-Math.PI/2;g.add(a);const b=mesh(new T.CylinderGeometry(s*.62,s,s*.45,8),gem,[0,0,s*.34]);b.rotation.x=Math.PI/2;g.add(b);return g;}
export function watch(){const root=new T.Group();root.name='SetDiamonde Watch — illustrative concept';const body=new T.Group();body.name='Case and dial';root.add(body);
body.add(disc(1.23,.32,metal),disc(1.04,.05,dark,.19),ring(1.14,.105,metal,.19));
for(let i=0;i<12;i++){const a=i*Math.PI/6;const tick=mesh(new T.BoxGeometry(.035,i%3===0?.19:.11,.02),metal,[Math.sin(a)*.88,Math.cos(a)*.88,.225]);tick.rotation.z=-a;body.add(tick);}
for(const [len,angle,width] of [[.6,-.9,.055],[.77,.85,.028]]){const hand=mesh(new T.BoxGeometry(width,len,.025),metal,[Math.sin(angle)*len/2,Math.cos(angle)*len/2,.25]);hand.rotation.z=-angle;body.add(hand);}body.add(disc(.065,.035,metal,.28));
const setting=new T.Group();setting.name='Illustrative stone-set bezel';root.add(setting);for(let i=0;i<48;i++){const a=i*Math.PI*2/48;const d=diamond(.069);d.position.set(Math.sin(a)*1.14,Math.cos(a)*1.14,.29);setting.add(d);}
for(const sign of [-1,1])for(let row=0;row<6;row++){for(let col=-1;col<=1;col++){const b=mesh(new RoundedBoxGeometry(col===0?.42:.28,.26,.16,3,.035),metal,[col*.35,sign*(1.27+row*.29),-.07-Math.pow(row/6,2)*.25]);b.rotation.x=sign*row*.045;body.add(b);}}
const crown=disc(.16,.2,metal);crown.rotation.y=Math.PI/2;crown.position.set(1.33,0,0);body.add(crown);root.userData={status:'Concept visualization; not engineering CAD',material:'Illustrative metal case',mechanism:'Not a representation of verified retaining geometry'};return root;}
function ovalFrame(cx){const shape=new T.Shape();shape.absellipse(cx,0,.85,.59,0,Math.PI*2,false,0);const hole=new T.Path();hole.absellipse(cx,0,.67,.43,0,Math.PI*2,true,0);shape.holes.push(hole);return mesh(new T.ExtrudeGeometry(shape,{depth:.17,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.045,bevelThickness:.045,curveSegments:48}),acetate);}
export function sunglasses(){const root=new T.Group();root.name='SetDiamonde Acetate Eyewear — exploratory concept';for(const sign of [-1,1]){root.add(ovalFrame(sign*.91));const l=mesh(new T.CircleGeometry(1,64),lens,[sign*.91,0,.09]);l.scale.set(.69,.45,1);root.add(l);const arm=mesh(new T.BoxGeometry(.15,.21,2.05),acetate,[sign*1.74,.15,-.93]);arm.rotation.y=-sign*.09;root.add(arm);root.add(mesh(new T.BoxGeometry(.25,.13,.17),metal,[sign*1.68,.19,.12]));for(let i=0;i<7;i++){const d=diamond(.043);d.position.set(sign*(1.29+i*.06),.37-Math.pow(i/7,2)*.11,.24);root.add(d);}}
const bridge=ring(.21,.055,acetate,.07);bridge.scale.y=.55;bridge.position.y=.16;root.add(bridge);root.userData={status:'Exploratory concept; retention, stress and material compatibility unvalidated',material:'Proposed high-grade acetate frame',design:'Original unbranded visualization'};return root;}
export function bracelet(){const root=new T.Group();root.name='Bracelet link concept';for(let i=0;i<11;i++){const a=(i-5)*.12;const g=new T.Group();g.add(mesh(new T.BoxGeometry(.36,.43,.17),metal));g.add(diamond(.145));g.position.set((i-5)*.4,-Math.pow((i-5)/5,2)*.35,0);g.rotation.z=-a;root.add(g);}return root;}
