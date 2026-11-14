# 3D prototype (reference only)

`entry.js` builds a capsule mannequin, drives it with simple joint animation and inverse-kinematics arms, and exposes `window.Pause3D.createStretch(canvas)` and `window.Pause3D.createSip(canvas)`.

It was written without being run in a browser, so poses may be off. The real app should replace it with a rigged `.glb` character and real animation clips (see `docs/BUILD_SPEC.md`, section 10).

Build: `npm install && npm run build` (outputs `dist/pause3d.js`).
