import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {meshopt} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptDecoder} from 'meshoptimizer';
await MeshoptEncoder.ready;
const source=process.argv[2];if(!source)throw Error('Pass the original downloaded GLB path');
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const doc=await io.read(source);
// Preserve triangle count and original 4K textures; compress geometry for delivery.
await doc.transform(meshopt({encoder:MeshoptEncoder,level:'high',quantizePosition:16,quantizeNormal:12,quantizeTexcoord:16}));
await io.write('public/models/watch-image-v1.glb',doc);
