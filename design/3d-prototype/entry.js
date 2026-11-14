import {
  Scene, PerspectiveCamera, WebGLRenderer, Group, Mesh, Vector3, Quaternion, Plane,
  CapsuleGeometry, SphereGeometry, CylinderGeometry, BoxGeometry, TorusGeometry, LatheGeometry, CircleGeometry,
  MeshStandardMaterial, MeshBasicMaterial, MeshPhysicalMaterial,
  HemisphereLight, DirectionalLight, DoubleSide, Vector2
} from 'three';

const clamp = (x, a, b) => Math.min(Math.max(x, a), b);
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const env = (t, L) => { const p = (t % L) / L; return smooth(0, 0.22, p) - smooth(0.78, 1, p); };
const DOWN = new Vector3(0, -1, 0);

const M = {
  skin: new MeshStandardMaterial({ color: 0xf4d9a8, roughness: 0.65 }),
  top: new MeshStandardMaterial({ color: 0x8b6cf6, roughness: 0.7 }),
  pants: new MeshStandardMaterial({ color: 0x3d3a6b, roughness: 0.8 }),
  hair: new MeshStandardMaterial({ color: 0x2b2a3a, roughness: 0.8 }),
  shoe: new MeshStandardMaterial({ color: 0xe8eef5, roughness: 0.6 }),
  dark: new MeshStandardMaterial({ color: 0x0b1b2e, roughness: 0.5 }),
  chair: new MeshStandardMaterial({ color: 0x9a8fcb, roughness: 0.8 }),
  desk: new MeshStandardMaterial({ color: 0xb9aee3, roughness: 0.7, transparent: true, opacity: 0.55 }),
  floor: new MeshBasicMaterial({ color: 0xcdc2f4, transparent: true, opacity: 0.5 })
};

function mesh(g, m) { return new Mesh(g, m); }

function buildArm(sx) {
  const l1 = 0.27, l2 = 0.25;
  const shoulder = new Group();
  shoulder.position.set(sx * 0.215, 0.46, 0);
  shoulder.add(mesh(new SphereGeometry(0.062, 20, 16), M.top));
  const upper = new Group();
  shoulder.add(upper);
  const um = mesh(new CapsuleGeometry(0.05, l1 - 0.1, 6, 16), M.top);
  um.position.y = -l1 / 2;
  upper.add(um);
  const elbow = new Group();
  elbow.position.y = -l1;
  upper.add(elbow);
  elbow.add(mesh(new SphereGeometry(0.047, 16, 12), M.skin));
  const fm = mesh(new CapsuleGeometry(0.04, l2 - 0.08, 6, 14), M.skin);
  fm.position.y = -l2 / 2;
  elbow.add(fm);
  const hand = new Group();
  hand.position.y = -l2;
  elbow.add(hand);
  const hm = mesh(new SphereGeometry(0.05, 16, 12), M.skin);
  hm.scale.set(0.85, 1.2, 0.55);
  hm.position.y = -0.05;
  hand.add(hm);
  return { shoulder, upper, elbow, hand, l1, l2, sx };
}

function buildMannequin(withFurniture) {
  const root = new Group();
  const floor = mesh(new CircleGeometry(1.3, 48), M.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.002;
  root.add(floor);

  if (withFurniture) {
    const seat = mesh(new BoxGeometry(0.5, 0.06, 0.5), M.chair);
    seat.position.set(0, 0.47, 0);
    root.add(seat);
    const back = mesh(new BoxGeometry(0.46, 0.5, 0.05), M.chair);
    back.position.set(0, 0.78, -0.27);
    root.add(back);
    const post = mesh(new CylinderGeometry(0.03, 0.03, 0.44, 12), M.chair);
    post.position.set(0, 0.22, 0);
    root.add(post);
    const base = mesh(new CylinderGeometry(0.28, 0.28, 0.03, 32), M.chair);
    base.position.set(0, 0.02, 0);
    root.add(base);
  }
  const desk = mesh(new BoxGeometry(1.2, 0.04, 0.6), M.desk);
  desk.position.set(0, 0.74, 0.65);
  root.add(desk);

  const pelvis = mesh(new SphereGeometry(0.17, 20, 16), M.pants);
  pelvis.scale.set(1, 0.6, 0.75);
  pelvis.position.set(0, 0.56, 0);
  root.add(pelvis);
  [-1, 1].forEach((sx) => {
    const th = mesh(new CapsuleGeometry(0.075, 0.28, 6, 14), M.pants);
    th.rotation.x = Math.PI / 2;
    th.position.set(sx * 0.09, 0.56, 0.2);
    root.add(th);
    const lg = mesh(new CapsuleGeometry(0.06, 0.3, 6, 14), M.pants);
    lg.position.set(sx * 0.09, 0.3, 0.4);
    root.add(lg);
    const ft = mesh(new BoxGeometry(0.1, 0.05, 0.2), M.shoe);
    ft.position.set(sx * 0.09, 0.03, 0.46);
    root.add(ft);
  });

  const torso = new Group();
  torso.position.set(0, 0.58, 0);
  root.add(torso);
  const tm = mesh(new CapsuleGeometry(0.155, 0.3, 8, 20), M.top);
  tm.scale.set(1, 1, 0.72);
  tm.position.y = 0.25;
  torso.add(tm);

  const neck = new Group();
  neck.position.set(0, 0.5, 0);
  torso.add(neck);
  const nm = mesh(new CylinderGeometry(0.042, 0.046, 0.09, 14), M.skin);
  nm.position.y = 0.045;
  neck.add(nm);
  const head = new Group();
  head.position.set(0, 0.09, 0);
  neck.add(head);
  const hd = mesh(new SphereGeometry(0.105, 28, 22), M.skin);
  hd.position.y = 0.095;
  head.add(hd);
  const hair = mesh(new SphereGeometry(0.112, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.55), M.hair);
  hair.position.set(0, 0.105, -0.008);
  head.add(hair);
  [-1, 1].forEach((sx) => {
    const eye = mesh(new SphereGeometry(0.0125, 10, 8), M.dark);
    eye.position.set(sx * 0.036, 0.104, 0.097);
    head.add(eye);
  });
  const mouth = mesh(new BoxGeometry(0.03, 0.006, 0.006), M.dark);
  mouth.position.set(0, 0.058, 0.101);
  head.add(mouth);

  const armL = buildArm(1);
  const armR = buildArm(-1);
  torso.add(armL.shoulder);
  torso.add(armR.shoulder);

  return { root, torso, neck, head, armL, armR };
}

function aim(g, dirW) {
  g.parent.updateWorldMatrix(true, false);
  const pq = g.parent.getWorldQuaternion(new Quaternion()).invert();
  const q = new Quaternion().setFromUnitVectors(DOWN, dirW);
  g.quaternion.copy(pq).multiply(q);
}

function reach(a, T, pole) {
  a.shoulder.updateWorldMatrix(true, false);
  const S = a.shoulder.getWorldPosition(new Vector3());
  const d = new Vector3().subVectors(T, S);
  let D = d.length();
  const dir = d.clone().normalize();
  D = Math.min(Math.max(D, Math.abs(a.l1 - a.l2) + 1e-3), a.l1 + a.l2 - 1e-3);
  const A = (a.l1 * a.l1 - a.l2 * a.l2 + D * D) / (2 * D);
  const H = Math.sqrt(Math.max(a.l1 * a.l1 - A * A, 0));
  const p = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
  const E = S.clone().add(dir.clone().multiplyScalar(A)).add(p.multiplyScalar(H));
  const Tc = S.clone().add(dir.clone().multiplyScalar(D));
  aim(a.upper, E.clone().sub(S).normalize());
  a.upper.updateWorldMatrix(true, true);
  aim(a.elbow, Tc.clone().sub(E).normalize());
}

function restArm(a) {
  a.shoulder.position.set(a.sx * 0.215, 0.46, 0);
  a.upper.rotation.set(-0.05, 0, a.sx * 0.07);
  a.elbow.rotation.set(-0.2, 0, 0);
  a.hand.rotation.set(0, 0, 0);
}

function makeStage(canvas, fov) {
  const cw = canvas.clientWidth || parseInt(canvas.getAttribute('width'), 10) || 560;
  const ch = canvas.clientHeight || parseInt(canvas.getAttribute('height'), 10) || 500;
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(cw, ch, false);
  renderer.localClippingEnabled = true;
  renderer.setClearColor(0x000000, 0);
  const scene = new Scene();
  const camera = new PerspectiveCamera(fov, cw / ch, 0.05, 20);
  scene.add(new HemisphereLight(0xffffff, 0xb8a9e8, 1.3));
  const key = new DirectionalLight(0xffffff, 2.2);
  key.position.set(2, 3, 2.5);
  scene.add(key);
  const fill = new DirectionalLight(0xc9b8ff, 0.8);
  fill.position.set(-2, 1, -1);
  scene.add(fill);
  return { renderer, scene, camera };
}

function createStretch(canvas) {
  const { renderer, scene, camera } = makeStage(canvas, 32);
  const B = buildMannequin(true);
  scene.add(B.root);
  const { torso, neck, head, armL, armR } = B;

  const glowMat = new MeshBasicMaterial({ color: 0xb48cff, transparent: true, opacity: 0.2, depthWrite: false });
  const glowA = mesh(new SphereGeometry(0.09, 20, 16), glowMat);
  const glowB = mesh(new TorusGeometry(0.09, 0.012, 10, 28), glowMat);
  const glowC = mesh(new TorusGeometry(0.2, 0.014, 10, 36), glowMat);
  [glowA, glowB, glowC].forEach((g) => { g.visible = false; scene.add(g); });

  const CAM = {
    neck: { p: [0.55, 1.3, 1.75], l: [0, 1.17, 0] },
    shoulder: { p: [0.45, 1.25, 1.85], l: [0, 1.1, 0] },
    twist: { p: [1.1, 1.9, 1.4], l: [0, 0.95, 0] },
    wrist: { p: [1.4, 1.3, 1.4], l: [0, 1.05, 0.25] }
  };
  let id = 'neck', s = 1, t0 = performance.now() / 1000;
  const look = new Vector3(0, 1.1, 0);
  camera.position.set(...CAM.neck.p);
  let raf = 0, alive = true;

  function setPose(newId, side) {
    id = newId; s = side; t0 = performance.now() / 1000;
  }

  function frame() {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    const now = performance.now() / 1000;
    const t = now - t0;
    torso.rotation.set(0, 0, 0);
    neck.rotation.set(0, 0, 0);
    head.rotation.set(0, 0, 0);
    restArm(armL); restArm(armR);
    torso.scale.set(1, 1 + 0.008 * Math.sin(now * 1.6), 1);
    glowA.visible = glowB.visible = glowC.visible = false;
    glowMat.opacity = 0.16 + 0.12 * Math.sin(now * 2.4);

    if (id === 'neck') {
      const e = env(t, 8);
      neck.rotation.z = s * 0.46 * e;
      head.rotation.z = s * 0.05 * e;
      const opp = s > 0 ? armL : armR;
      opp.upper.rotation.z = opp.sx * (0.07 + 0.18 * e);
      opp.shoulder.position.y = 0.46 - 0.025 * e;
      glowA.visible = true;
      neck.add(glowA);
      glowA.position.set(-s * 0.05, 0.05, 0);
      glowA.scale.set(0.7, 1.2, 0.7);
    } else if (id === 'shoulder') {
      const ph = (t / 3) * Math.PI * 2;
      [armL, armR].forEach((a) => {
        a.shoulder.position.y = 0.46 + 0.045 * Math.sin(ph);
        a.shoulder.position.z = 0.045 * Math.cos(ph);
      });
      glowB.visible = true;
      torso.add(glowB);
      glowB.rotation.set(Math.PI / 2, 0, 0);
      glowB.position.set(0, 0.46, 0);
      glowB.scale.set(2.2, 2.2, 1.2);
    } else if (id === 'twist') {
      const e = env(t, 8);
      torso.rotation.y = -s * 0.8 * e;
      head.rotation.y = -s * 0.35 * e;
      const xr = -s;
      const near = s > 0 ? armR : armL;
      const far = s > 0 ? armL : armR;
      B.root.updateMatrixWorld(true);
      reach(near, new Vector3(xr * 0.34, 0.92, -0.34), new Vector3(xr * 0.8, 0, -0.6));
      reach(far, new Vector3(xr * 0.09, 0.68, 0.36), new Vector3(-xr * 0.8, -0.2, 0.2));
      glowC.visible = true;
      torso.add(glowC);
      glowC.rotation.set(Math.PI / 2, 0, 0);
      glowC.position.set(0, 0.22, 0);
      glowC.scale.set(1, 0.75, 1);
    } else if (id === 'wrist') {
      const e = env(t, 6);
      const ext = s > 0 ? armR : armL;
      const asst = s > 0 ? armL : armR;
      ext.upper.rotation.set(-1.57, 0, 0);
      ext.elbow.rotation.set(0, 0, 0);
      ext.hand.rotation.set(-0.95 * e, 0, 0);
      B.root.updateMatrixWorld(true);
      const hp = ext.hand.localToWorld(new Vector3(0, -0.1, 0));
      reach(asst, hp, new Vector3(asst.sx * 0.5, -0.8, 0));
      glowA.visible = true;
      ext.elbow.add(glowA);
      glowA.position.set(0, -0.12, 0);
      glowA.scale.set(0.5, 1.5, 0.5);
    }

    const c = CAM[id];
    camera.position.lerp(new Vector3(...c.p), 0.05);
    look.lerp(new Vector3(...c.l), 0.05);
    camera.lookAt(look);
    renderer.render(scene, camera);
  }
  frame();

  return {
    setPose,
    dispose() { alive = false; cancelAnimationFrame(raf); renderer.dispose(); }
  };
}

function createSip(canvas) {
  const { renderer, scene, camera } = makeStage(canvas, 30);
  const B = buildMannequin(true);
  scene.add(B.root);
  const { torso, neck, head, armL, armR } = B;

  const H = 0.13;
  const pts = [
    new Vector2(0, -H / 2), new Vector2(0.03, -H / 2), new Vector2(0.033, -H / 2 + 0.005),
    new Vector2(0.0385, H / 2), new Vector2(0.0365, H / 2), new Vector2(0.0315, -H / 2 + 0.012),
    new Vector2(0, -H / 2 + 0.012)
  ];
  const glass = new Group();
  scene.add(glass);
  glass.add(mesh(new LatheGeometry(pts, 36), new MeshPhysicalMaterial({
    color: 0xffffff, transparent: true, opacity: 0.3, roughness: 0.05, metalness: 0,
    side: DoubleSide, depthWrite: false
  })));
  const plane = new Plane(new Vector3(0, -1, 0), 2);
  const Hi = H - 0.012;
  const water = mesh(new CylinderGeometry(0.0365, 0.0315, Hi, 36, 1, false), new MeshStandardMaterial({
    color: 0x6fc4f2, transparent: true, opacity: 0.8, roughness: 0.1, side: DoubleSide, clippingPlanes: [plane]
  }));
  water.position.y = 0.006;
  glass.add(water);

  const restPos = new Vector3(-0.28, 0.76 + H / 2, 0.42);
  const mouth = new Vector3(0, 1.215, 0.105);
  camera.position.set(0.95, 1.4, 1.75);
  const lookAt = new Vector3(-0.05, 1.08, 0.15);
  camera.lookAt(lookAt);

  const L = 6.5;
  let playing = false, tStart = 0, raf = 0, alive = true, onDone = null;

  function sip(cb) {
    playing = true; tStart = performance.now() / 1000; onDone = cb || null;
  }

  function frame() {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    const now = performance.now() / 1000;
    let u = 0;
    if (playing) {
      u = (now - tStart) / L;
      if (u >= 1) { playing = false; u = 0; if (onDone) { const f = onDone; onDone = null; f(); } }
    }
    torso.rotation.set(0, 0, 0);
    neck.rotation.set(0, 0, 0);
    head.rotation.set(0, 0, 0);
    restArm(armL); restArm(armR);
    torso.scale.set(1, 1 + 0.008 * Math.sin(now * 1.6), 1);

    const lift = smooth(0.1, 0.32, u) - smooth(0.74, 0.94, u);
    const tilt = smooth(0.32, 0.46, u) - smooth(0.58, 0.72, u);
    const th = 0.78 * tilt;
    const drink = new Vector3(0, mouth.y - (H / 2) * Math.cos(th), mouth.z + (H / 2) * Math.sin(th));
    const pos = restPos.clone().lerp(drink, lift);
    pos.y += 0.03 * Math.sin(Math.PI * lift);
    glass.position.copy(pos);
    glass.rotation.set(-th, 0, 0);
    neck.rotation.x = -0.16 * tilt;

    const f = 0.55 - 0.07 * smooth(0.46, 0.6, u) * (1 - smooth(0.9, 1, u));
    const baseY = pos.y - (H / 2 - 0.012) * Math.cos(th);
    plane.constant = baseY + f * Hi * Math.cos(th);

    B.root.updateMatrixWorld(true);
    reach(armR, pos.clone().add(new Vector3(-0.045, 0, 0.0)), new Vector3(-0.6, -0.7, -0.1));
    reach(armL, new Vector3(0.18, 0.84, 0.28), new Vector3(0.6, -0.8, -0.1));

    renderer.render(scene, camera);
  }
  frame();

  return {
    sip,
    dispose() { alive = false; cancelAnimationFrame(raf); renderer.dispose(); }
  };
}

function safe(fn) {
  return (canvas) => {
    try { return fn(canvas); } catch (e) { console.error('Pause3D failed', e); return null; }
  };
}

window.Pause3D = { createStretch: safe(createStretch), createSip: safe(createSip) };
