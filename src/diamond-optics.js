import * as THREE from 'three';

// Interactive optical approximation: planar internal reflections and dispersion.
// This is a display shader, not a gemological or engineering simulation.
export function createDiamondOptics(environment){
 const material=new THREE.ShaderMaterial({name:'Studio diamond optics',uniforms:{environment:{value:environment},cameraLocal:{value:new THREE.Vector3()},radius:{value:1.06}},vertexShader:`
 uniform float radius; varying vec3 localPosition; varying vec3 localNormal;
 void main(){localPosition=position/radius;localNormal=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
 `,fragmentShader:`
 precision highp float;
 uniform samplerCube environment; uniform vec3 cameraLocal; uniform mat4 modelMatrix;
 varying vec3 localPosition; varying vec3 localNormal;
 const float PI=3.14159265359;
 vec3 studio(vec3 d){return textureCube(environment,normalize(mat3(modelMatrix)*d)).rgb;}
 void planeHit(vec3 p,vec3 d,vec3 n,float bound,inout float distance,inout vec3 normal){float denom=dot(d,n);if(denom>0.0001){float t=(bound-dot(p,n))/denom;if(t>0.0003&&t<distance){distance=t;normal=n;}}}
 vec3 traceGem(vec3 p,vec3 d,float ior){vec3 result=vec3(0.0);float weight=1.0;
 for(int bounce=0;bounce<5;bounce++){float distance=1000.0;vec3 normal=vec3(0.,0.,1.);
 for(int i=0;i<16;i++){float a=2.0*PI*(float(i)+0.5)/16.0;vec2 radial=vec2(cos(a),sin(a));
 vec3 pavilion=normalize(vec3(radial,-1.0/0.71));planeHit(p,d,pavilion,0.995/length(vec3(radial,-1.0/0.71)),distance,normal);
 vec3 crown=normalize(vec3(radial,0.44/0.49));planeHit(p,d,crown,1.022/length(vec3(radial,0.44/0.49)),distance,normal);
 planeHit(p,d,vec3(radial,0.),.997,distance,normal);}
 planeHit(p,d,vec3(0.,0.,1.),.49,distance,normal);planeHit(p,d,vec3(0.,0.,-1.),.71,distance,normal);
 if(distance>999.){result+=studio(d)*weight;weight=0.;break;}
 p+=d*distance;vec3 escape=refract(d,-normal,ior);float fresnel=pow((ior-1.)/(ior+1.),2.);fresnel=fresnel+(1.-fresnel)*pow(1.-abs(dot(d,normal)),5.);
 if(dot(escape,escape)>.001){result+=studio(escape)*weight*(1.-fresnel);weight*=fresnel;}
 d=reflect(d,normal);p+=d*.001;weight*=.96;}
 return result+studio(d)*weight*.25;}
 void main(){vec3 n=normalize(localNormal);vec3 incident=normalize(localPosition-cameraLocal);if(dot(n,incident)>0.)n=-n;float f=.172+(.828)*pow(1.-max(0.,dot(-incident,n)),5.);vec3 reflected=studio(reflect(incident,n));vec3 entry=refract(incident,n,1./2.417);vec3 p=localPosition+entry*.004;
 vec3 r=traceGem(p,refract(incident,n,1./2.407),2.407);vec3 g=traceGem(p,entry,2.417);vec3 b=traceGem(p,refract(incident,n,1./2.427),2.427);
 vec3 color=reflected*f+vec3(r.r,g.g,b.b)*(1.-f);gl_FragColor=vec4(color,1.0);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }
 `});return material;
}
export function attachDiamondOptics(group,material,radius){group.traverse(mesh=>{if(!mesh.isMesh||!mesh.material.name.startsWith('Diamond optical'))return;mesh.material=material;const inverse=new THREE.Matrix4();const pos=new THREE.Vector3();mesh.onBeforeRender=(renderer,scene,camera)=>{inverse.copy(mesh.matrixWorld).invert();camera.getWorldPosition(pos);pos.applyMatrix4(inverse).divideScalar(radius);material.uniforms.cameraLocal.value.copy(pos);material.uniforms.radius.value=radius;material.uniformsNeedUpdate=true;};});}
