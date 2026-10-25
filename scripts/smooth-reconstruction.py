"""Remove reconstruction-scale surface noise without changing source downloads."""
import json,struct,numpy as np,sys
source,prefix=sys.argv[1:]
b=open(source,'rb').read();n=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+n]);data=b[28+n:]
def accessor(i):
 a=j['accessors'][i];v=j['bufferViews'][a['bufferView']];w={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']];return np.frombuffer(data,dtype={5126:'f4',5125:'u4',5123:'u2'}[a['componentType']],count=a['count']*w,offset=v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(-1,w)
for k,mesh in enumerate(j['meshes']):
 pr=mesh['primitives'][0];original=accessor(pr['attributes']['POSITION']);tri=accessor(pr['indices']).reshape(-1,3)
 # Weld positions across UV seams before averaging; preserve the original indexing.
 v,reverse=np.unique(np.round(original,6),axis=0,return_inverse=True);tri=reverse[tri]
 edges=np.concatenate([tri[:,[0,1]],tri[:,[1,2]],tri[:,[2,0]]]);a=np.concatenate([edges[:,0],edges[:,1]]);c=np.concatenate([edges[:,1],edges[:,0]])
 count=np.maximum(np.bincount(a,minlength=len(v)),1)
 for iteration in range(12):
  avg=np.stack([np.bincount(a,weights=v[c,d],minlength=len(v))/count for d in range(3)],axis=1)
  v+= (.48 if iteration%2==0 else -.5)*(avg-v)
 face=np.cross(v[tri[:,1]]-v[tri[:,0]],v[tri[:,2]]-v[tri[:,0]])
 normal=np.stack([np.bincount(tri.flatten(),weights=np.repeat(face[:,d],3),minlength=len(v)) for d in range(3)],axis=1)
 normal/=np.maximum(np.linalg.norm(normal,axis=1)[:,None],1e-20)
 v[reverse].astype('f4').tofile(prefix+f'-{k}-positions.bin');normal[reverse].astype('f4').tofile(prefix+f'-{k}-normals.bin')
 print(k,'vertices',len(original),'max smoothing shift',float(np.max(np.linalg.norm(v[reverse]-original,axis=1))))
