import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
const metal=new T.MeshStandardMaterial({color:0xc8c3b8,metalness:1,roughness:.23});
const dark=new T.MeshStandardMaterial({color:0x111815,metalness:.48,roughness:.3});
const gem=new T.MeshPhysicalMaterial({color:0xe2f0ff,metalness:.4,roughness:.025,clearcoat:1,ior:2.417,transmission:.18,thickness:.16,dispersion:.045,flatShading:true,side:T.DoubleSide});
const pixels=new Uint8Array(256*256*4);for(let y=0;y<256;y++)for(let x=0;x<256;x++){const wave=Math.sin(x*.065+Math.sin(y*.043)*3)*Math.cos(y*.054+Math.sin(x*.033)*2);const t=Math.pow(Math.max(0,wave),.7);const i=(y*256+x)*4;pixels[i]=25+140*t;pixels[i+1]=12+63*t;pixels[i+2]=7+14*t;pixels[i+3]=255;}const tortoise=new T.DataTexture(pixels,256,256);tortoise.colorSpace=T.SRGBColorSpace;tortoise.wrapS=tortoise.wrapT=T.RepeatWrapping;tortoise.needsUpdate=true;
const acetate=new T.MeshPhysicalMaterial({color:0xffffff,map:tortoise,roughness:.14,metalness:.03,clearcoat:1,clearcoatRoughness:.06});
const lens=new T.MeshPhysicalMaterial({color:0x3a3026,metalness:.25,roughness:.12,transparent:true,opacity:.88,clearcoat:1});
function mesh(g,m,p=[0,0,0]){const x=new T.Mesh(g,m);x.position.set(...p);x.castShadow=true;x.receiveShadow=true;return x;}
function ring(radius,tube,mat,z=0){return mesh(new T.TorusGeometry(radius,tube,12,96),mat,[0,0,z]);}
function disc(r,d,mat,z=0){const x=mesh(new T.CylinderGeometry(r,r,d,96),mat,[0,0,z]);x.rotation.x=Math.PI/2;return x;}
function diamond(s=.08){
 const rings=[{r:0,z:-.8},{r:.63,z:-.4},{r:1,z:0},{r:1,z:.035},{r:.84,z:.27},{r:.51,z:.49}];
 const points=[];const n=16;
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<n;i++){const a=i*Math.PI*2/n,b=(i+1)*Math.PI*2/n;const u=rings[j],v=rings[j+1];const p=[Math.cos(a)*u.r*s,Math.sin(a)*u.r*s,u.z*s],q=[Math.cos(b)*u.r*s,Math.sin(b)*u.r*s,u.z*s],r=[Math.cos(a)*v.r*s,Math.sin(a)*v.r*s,v.z*s],t=[Math.cos(b)*v.r*s,Math.sin(b)*v.r*s,v.z*s];if(u.r>0)points.push(...p,...q,...r);points.push(...q,...t,...r);}
 for(let i=0;i<n;i++){const a=i*Math.PI*2/n,b=(i+1)*Math.PI*2/n;points.push(0,0,.49*s,Math.cos(a)*.51*s,Math.sin(a)*.51*s,.49*s,Math.cos(b)*.51*s,Math.sin(b)*.51*s,.49*s);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));geo.computeVertexNormals();return mesh(geo,gem);
}

export function watch(){const root=new T.Group();root.name='SetDiamonde Watch — illustrative concept';const body=new T.Group();body.name='Case and dial';root.add(body);
body.add(disc(1.23,.32,metal),disc(1.04,.05,dark,.19),ring(1.14,.105,metal,.19));
for(let i=0;i<12;i++){const a=i*Math.PI/6;const tick=mesh(new T.BoxGeometry(.035,i%3===0?.19:.11,.02),metal,[Math.sin(a)*.88,Math.cos(a)*.88,.225]);tick.rotation.z=-a;body.add(tick);}
for(const [len,angle,width] of [[.6,-.9,.055],[.77,.85,.028]]){const hand=mesh(new T.BoxGeometry(width,len,.025),metal,[Math.sin(angle)*len/2,Math.cos(angle)*len/2,.25]);hand.rotation.z=-angle;body.add(hand);}body.add(disc(.065,.035,metal,.28));
const setting=new T.Group();setting.name='Illustrative stone-set bezel';root.add(setting);for(let i=0;i<48;i++){const a=i*Math.PI*2/48;const d=diamond(.069);d.position.set(Math.sin(a)*1.14,Math.cos(a)*1.14,.29);setting.add(d);}
for(const sign of [-1,1])for(let row=0;row<6;row++){for(let col=-1;col<=1;col++){const b=mesh(new RoundedBoxGeometry(col===0?.42:.28,.26,.16,3,.035),metal,[col*.35,sign*(1.27+row*.29),-.07-Math.pow(row/6,2)*.25]);b.rotation.x=sign*row*.045;body.add(b);}}
const crown=disc(.16,.2,metal);crown.rotation.y=Math.PI/2;crown.position.set(1.33,0,0);body.add(crown);root.userData={status:'Concept visualization; not engineering CAD',material:'Illustrative metal case',mechanism:'Not a representation of verified retaining geometry'};return root;}
function ovalFrame(cx){const shape=new T.Shape();shape.absellipse(cx,0,.85,.59,0,Math.PI*2,false,0);const hole=new T.Path();hole.absellipse(cx,0,.67,.43,0,Math.PI*2,true,0);shape.holes.push(hole);return mesh(new T.ExtrudeGeometry(shape,{depth:.17,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.045,bevelThickness:.045,curveSegments:48}),acetate);}
export function sunglasses(){const root=new T.Group();root.name='SetDiamonde Acetate Eyewear — exploratory concept';for(const sign of [-1,1]){root.add(ovalFrame(sign*.91));const l=mesh(new T.CircleGeometry(1,64),lens,[sign*.91,0,.09]);l.scale.set(.69,.45,1);root.add(l);const arm=mesh(new T.BoxGeometry(.15,.21,2.05),acetate,[sign*1.74,.15,-.93]);arm.rotation.y=-sign*.09;root.add(arm);root.add(mesh(new T.BoxGeometry(.25,.13,.17),metal,[sign*1.68,.19,.12]));for(let i=0;i<3;i++){const d=diamond(.085);d.rotation.x=-Math.PI/2;d.position.set(sign*(1.74+.025*i),.28,-.25-i*.32);root.add(d);}}
const bridge=ring(.21,.055,acetate,.07);bridge.scale.y=.55;bridge.position.y=.16;root.add(bridge);root.userData={status:'Exploratory concept; retention, stress and material compatibility unvalidated',material:'Proposed high-grade acetate frame',design:'Original unbranded visualization'};return root;}
export function bracelet(){const root=new T.Group();root.name='Articulated bracelet link concept';for(let i=0;i<11;i++){const g=new T.Group();g.add(ring(.16,.018,metal,-.012),ring(.11,.018,metal,-.16));for(let k=0;k<3;k++){const a=k*Math.PI*2/3;g.add(mesh(new T.CylinderGeometry(.016,.016,.15,10),metal,[Math.cos(a)*.115,Math.sin(a)*.115,-.085]));const strut=g.children[g.children.length-1];strut.rotation.x=Math.PI/2;}const stone=diamond(.16);stone.position.z=.025;g.add(stone);const a=(i-5)*.12;g.position.set((i-5)*.36,-Math.pow((i-5)/5,2)*.35,0);g.rotation.z=-a;root.add(g);if(i<10){const joint=mesh(new T.CylinderGeometry(.035,.035,.14,12),metal,[(i-4.5)*.36,-Math.pow((i-4.5)/5,2)*.35,-.085]);root.add(joint);}}root.userData={status:'Illustrative articulated link study, not qualified construction'};return root;}
