# SetDiamonde — discussion prototype

Private meeting demonstration prepared by VentVest. Original luxury presentation with a watch-led application gallery, bracelet-link concept and exploratory high-grade acetate sunglasses concept.

## Run

- Node 20.19+ or 22.12+ (Node 24 used for this build).
- `npm ci`
- `npm run dev`
- `npm run build`

## Vercel

Import `johnbuena/casestudy02-setdiamonde`. Framework preset: **Vite**. Root: repository root. Build command: `npm run build`. Output directory: `dist`. No environment variables required. Assign `www.casestudy02.ventvest.com` in project domain settings. The existing hostname response does not prove this repository is already connected.

Enable Vercel deployment protection if confidentiality is required. `noindex` discourages indexing; it is not access control. Files in public are downloadable.

## 3D assets

`public/models/watch.glb` and `public/models/sunglasses.glb` are original procedurally authored visualization assets, not Tripo outputs or engineering CAD. Regenerate with `npm run assets`. Models contain status metadata. The browser uses the same geometry factories in `src/models.js`.

No hidden retention geometry, material validation, strength, safety, production speed or cost advantage is claimed. Acetate is a proposed high-grade plastic for the eyewear study; carrier design and compatibility require engineering review. No third-party luxury brand endorsement is implied.

## Evidence and data

Two supplied CAD reference images are included, captioned as reference material. Confirm permission and suitability before broad public distribution. Public patent link is a source, not a legal opinion. The assessment form generates a local text download only; no backend, email, CRM or data collection is configured. No API keys or personal contact records are included.

## Meeting walkthrough

1. Introduce the watch-led design proposition.
2. Open the watch application details; distinguish concept from evidence.
3. Explore bracelet and acetate sunglasses studies.
4. Switch the atelier between the two 3D models; rotate and download.
5. Review supplied CAD and public patent source.
6. Prepare and download a local application brief.

Fallback: use static CAD references if WebGL is unavailable. Keep a browser PDF or screenshots for offline presentation. No live generation service is required.

## ImageGen editorial update

Four selected 1536 × 1024 PNG concept images are in `public/editorial/`: watch, bracelet, acetate temple macro and a matched mounting comparison. They were generated and visually reviewed with digital-design and jewelry-setting agent guidance. Rejected versions with unintended prongs were not integrated. The lower support details are appearance concepts, not exact proprietary engineering. Comparison concerns visible crown coverage only.

Click photographs to inspect at up to 250% display magnification; this enlarges original pixels and does not add image resolution. All three simplified 3D studies can rotate with neutral/warm studio lighting and front/oblique/close-up cameras. These are not photorealistic turntable reconstructions of the generated stills. GLB exports include a third bracelet asset; exported acetate uses a solid representative color while the browser adds procedural marbling.

GitHub publication remains deferred at the user's request.

## Reference-fidelity revision

The current site uses the three detailed ImageGen photographs in the atelier instead of the simplified procedural 3D viewer. Controls provide image cropping and full-resolution inspection, not object rotation. Earlier GLB files remain as development artifacts; they are not the currently presented products.

Eyewear now follows the supplied side-set tortoiseshell design (`sunglasses-side-v2.png`). The new comparison and dedicated `retainer-cutaway-v2.png` illustrate a silver cup and stepped lower retaining insert based on supplied references. The insert matches the carrier metal; seams and finish distinguish the components. These illustrations show the intended retention arrangement without claiming tested strength or safety. Original CAD remains available for comparison.

## Refined watch inspection prototype

Open `/#watch-inspector`, then choose **Load interactive watch**. This adds an original procedural watch with 44 faceted stones, separate lower sleeves, a perforated bezel carrier, a sunray dial, applied indices, three hands, crystal, knurled crown, closed caseback and curved bracelet links. Orbit/zoom/pan controls, six camera presets, automatic rotation, warm lighting and crystal visibility support inspection. A separate cutaway specimen includes an illustrative separation slider.

`src/refined-watch.js` is the editable geometry source. `src/watch-inspector.js` contains the viewer; `src/diamond-optics.js` contains an artistic internal-reflection shader. The latter is a real-time visual approximation, not a physically validated optical simulation. Extreme macro views remain recognizably rendered. Keep the ImageGen stills as the editorial imagery.

Regenerate interchange files with `node scripts/export-refined-watch.mjs`:
- `public/models/watch-refined-v1.glb`: named components and portable PBR materials (~12.8 MB).
- `public/models/setting-simulation-v1.glb`: separate demonstration specimen.
- `public/models/watch-refined-v1.obj.gz`: gzip-compressed geometry-only OBJ; decompress before importing.
- `public/models/watch-refined-v1-spec.json`: illustrative parameters and provenance.

GLB viewers use the portable PBR material rather than the website's custom diamond shader, so appearance varies. Geometry coordinates use illustrative millimetres; check import scaling in downstream software. These are visualization meshes, not STEP solids, manufacturing CAD or Tripo-generated assets. Retention geometry is invented for the demo and establishes no proprietary construction, strength or manufacturing tolerance. No Tripo credits were used.

Verification: production build passed; both GLBs parsed with Three GLTFLoader and all position values were finite (334 watch meshes; 6 specimen meshes). Browser inspection covered bezel macro, crown, caseback, setting cutaway and separation, rotation, lighting, crystal control, and a 390px mobile layout without horizontal overflow. Three.js is lazy-loaded on the load button; Vite reports a size warning for the ~547 KB uncompressed viewer chunk. No deployment or GitHub push was performed.

## Image-derived comparison: 3D-1 / 3D-2

The interactive section now offers **3D-1** (the preserved procedural watch) and **3D-2** (the Tripo image-derived trial), with version links above the viewer and no overlay button on the image. Deep links `/#3d-1` and `/#3d-2` select and load the corresponding model. Public link labels omit generator names. Both support orbit, zoom, rotation and lighting; the cutaway/crystal controls belong only to 3D-1.

3D-2 was generated privately from the existing `public/editorial/watch-studio.png` using Tripo H3.1 Geometry & Texture, 4K export. One generation used 55 credits (780 → 725); no additional generation or credit purchase. Task: `b287edf7-777f-4013-abe3-eefb835ec129`. The original downloaded file remains at `/Users/reyco/Downloads/watch-image-v1.glb`. Provenance is recorded in `public/models/watch-image-v1-provenance.json`.

The delivered `watch-image-v1.glb` is 18.16 MB versus the original 63.73 MB. All 1,929,930 triangles and the original three texture payloads are retained; mesh compression includes fine position/normal/UV quantization. Reproduce with `node scripts/prepare-image-watch.mjs /path/to/original.glb`. The viewer loads the mesh decoder locally through the Three.js bundle. This is a detailed trial asset, still relatively heavy for mobile rendering.

Visual assessment: image-derived metal finish and texture are closer to the reference, but stones show reconstruction artifacts at macro scale, and cropped bracelet ends/underside are inferred. It is not an exact photorealistic reconstruction or production engineering model. Preserve both versions for comparison rather than declaring a quality winner.
