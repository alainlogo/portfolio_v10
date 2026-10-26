import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EMAIL } from "./data";

// A conference badge hanging from a lanyard. The strap is a Verlet rope, the
// card is a heavy point at its end, and a damped spring twists the card around
// its long axis whenever it swings sideways, so its back shows now and then.

const PAPER = "#ededE8";
const INK = "#0b0b0b";
const BLUE = "#1f2bd6";
// The page behind the badge, seen through the slot punched in the card.
const BG = "#fdfbf7";
const CARD = "#ffffff";
const CARD_TEXT = INK;

const FOV = 30;
const CAMERA_Z = 12;
const CARD_W = 1.6;
const CARD_H = 2.24;
const CARD_D = 0.03;
// Room for the metal clip between the strap and the card.
const CLIP = 0.14;
const HANG = CLIP + CARD_H;
const STRAP_W = 0.18;
const LINKS = 10;
const LINK = 0.2;
const STRAP_SAMPLES = 64;
const MAX_WIDTH_SHARE = 0.36;

const STEP = 1 / 120;
const ITERATIONS = 12;
const GRAVITY = 40;
const DAMPING = 0.992;
// The card weighs about seven times a strap link.
const CARD_INV_MASS = 0.15;
const TWIST_SPRING = 7;
const TWIST_DAMPING = 1.1;
const TWIST_FROM_SWING = 3;
// The badge falls in from this far above its resting place.
const DROP = 6;
const DROP_TIME = 1;

function slot(ctx, w) {
  ctx.fillStyle = BG;
  ctx.beginPath();
  ctx.roundRect(w / 2 - 60, 34, 120, 24, 12);
  ctx.fill();
}

function drawFront(ctx, w, h, fonts, photo) {
  ctx.fillStyle = CARD;
  ctx.fillRect(0, 0, w, h);
  slot(ctx, w);

  ctx.fillStyle = CARD_TEXT;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `800 66px ${fonts.display}`;
  ctx.fillText("Alain Logo", w / 2, 150);

  const px = 110;
  const py = 185;
  const pw = w - 220;
  const ph = 440;
  if (photo) {
    const scale = Math.max(pw / photo.width, ph / photo.height);
    const sw = pw / scale;
    const sh = ph / scale;
    ctx.save();
    ctx.filter = "grayscale(1)";
    ctx.drawImage(photo, (photo.width - sw) / 2, (photo.height - sh) / 2, sw, sh, px, py, pw, ph);
    ctx.restore();
  } else {
    ctx.fillStyle = BLUE;
    ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = PAPER;
    ctx.textBaseline = "middle";
    ctx.font = `800 240px ${fonts.display}`;
    ctx.fillText("AL", w / 2, py + ph / 2 + 10);
    ctx.textBaseline = "alphabetic";
  }

  ctx.fillStyle = CARD_TEXT;
  ctx.font = `800 60px ${fonts.display}`;
  ctx.fillText("web", w / 2, 718);
  ctx.fillText("developer", w / 2, 774);

  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(48, h - 86, w - 96, 2);
  ctx.fillStyle = CARD_TEXT;
  ctx.font = `600 22px ${fonts.body}`;
  ctx.textAlign = "left";
  ctx.fillText("Studio218", 48, h - 46);
  ctx.textAlign = "right";
  ctx.fillText("FR", w - 48, h - 46);
}

function drawBack(ctx, w, h, fonts) {
  ctx.fillStyle = CARD;
  ctx.fillRect(0, 0, w, h);
  slot(ctx, w);

  ctx.fillStyle = BLUE;
  ctx.beginPath();
  ctx.arc(84, 130, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAPER;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 24px ${fonts.display}`;
  ctx.fillText("AL", 84, 132);

  ctx.fillStyle = CARD_TEXT;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `800 78px ${fonts.display}`;
  ["Front-end,", "UI / UX &", "Back-end"].forEach((line, i) => {
    ctx.fillText(line, 48, h - 280 + i * 74);
  });

  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.font = `600 22px ${fonts.body}`;
  ctx.fillText(EMAIL, 48, h - 46);
}

function drawStrap(ctx, w, h, fonts) {
  ctx.fillStyle = BLUE;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w / 2, 0);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = PAPER;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `700 46px ${fonts.body}`;
  const word = "ALAIN LOGO  •  ";
  const step = ctx.measureText(word).width;
  for (let x = 0; x < h; x += step) ctx.fillText(word, x, 0);
  ctx.restore();
}

function canvasTexture(w, h, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const redraw = (...args) => {
    draw(ctx, w, h, ...args);
    texture.needsUpdate = true;
  };
  return { texture, redraw };
}

// Keeps two points at a fixed distance, moving each in proportion to its
// inverse mass (0 = pinned).
function solve(a, b, rest, ia, ib, tmp) {
  const w = ia + ib;
  if (w === 0) return;
  tmp.subVectors(b, a);
  const len = tmp.length() || 1e-6;
  tmp.multiplyScalar((len - rest) / len / w);
  a.addScaledVector(tmp, ia);
  b.addScaledVector(tmp, -ib);
}

export default function Badge({ ready = true, reduce = false, photo = null, anchorX = 0.56 }) {
  const wrapRef = useRef(null);
  const readyRef = useRef(ready);
  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    camera.position.z = CAMERA_Z;

    // Textures

    const front = canvasTexture(640, 896, drawFront);
    const back = canvasTexture(640, 896, drawBack);
    const strap = canvasTexture(128, 1024, drawStrap);
    strap.texture.wrapT = THREE.RepeatWrapping;
    const anisotropy = renderer.capabilities.getMaxAnisotropy();
    [front, back, strap].forEach((t) => (t.texture.anisotropy = anisotropy));

    const style = getComputedStyle(wrap);
    const fonts = {
      display: style.getPropertyValue("--font-display") || "sans-serif",
      body: style.getPropertyValue("--font-body") || "sans-serif",
    };
    let image = null;
    const paint = () => {
      front.redraw(fonts, image);
      back.redraw(fonts);
      strap.redraw(fonts);
    };
    paint();
    let alive = true;
    Promise.all([
      document.fonts.load(`800 64px ${fonts.display}`),
      document.fonts.load(`600 22px ${fonts.body}`),
      document.fonts.load(`700 46px ${fonts.body}`),
    ])
      .catch(() => {})
      .then(() => alive && paint());
    if (photo) {
      const img = new Image();
      img.onload = () => {
        image = img;
        if (alive) paint();
      };
      img.src = photo;
    }

    // Card, clip and strap

    const card = new THREE.Group();
    scene.add(card);

    const edgeMat = new THREE.MeshBasicMaterial({ color: 0xd6d6d0 });
    const frontMat = new THREE.MeshBasicMaterial({ map: front.texture });
    const backMat = new THREE.MeshBasicMaterial({ map: back.texture });
    const cardGeo = new THREE.BoxGeometry(CARD_W, CARD_H, CARD_D);
    cardGeo.translate(0, -CLIP - CARD_H / 2, 0);
    const cardMesh = new THREE.Mesh(cardGeo, [edgeMat, edgeMat, edgeMat, edgeMat, frontMat, backMat]);
    card.add(cardMesh);

    const clipMat = new THREE.MeshBasicMaterial({ color: 0x9a9caa });
    const clipGeo = new THREE.BoxGeometry(0.24, CLIP + 0.1, 0.06);
    clipGeo.translate(0, -(CLIP + 0.1) / 2, 0);
    card.add(new THREE.Mesh(clipGeo, clipMat));

    const strapGeo = new THREE.BufferGeometry();
    const strapPos = new Float32Array(STRAP_SAMPLES * 2 * 3);
    const strapUv = new Float32Array(STRAP_SAMPLES * 2 * 2);
    const strapIndex = [];
    for (let i = 0; i < STRAP_SAMPLES - 1; i++) {
      const a = i * 2;
      strapIndex.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    strapGeo.setIndex(strapIndex);
    strapGeo.setAttribute("position", new THREE.BufferAttribute(strapPos, 3));
    strapGeo.setAttribute("uv", new THREE.BufferAttribute(strapUv, 2));
    const strapMat = new THREE.MeshBasicMaterial({ map: strap.texture, side: THREE.DoubleSide });
    const strapMesh = new THREE.Mesh(strapGeo, strapMat);
    strapMesh.frustumCulled = false;
    scene.add(strapMesh);
    // The texture is 1:8, so one repeat covers eight strap widths.
    const strapRepeat = STRAP_W * 8;

    // Physics state: points[0] is the anchor, points[LINKS] the clip.

    const points = Array.from({ length: LINKS + 1 }, () => new THREE.Vector3());
    const prev = points.map(() => new THREE.Vector3());
    const tip = new THREE.Vector3();
    const tipPrev = new THREE.Vector3();
    const anchor = new THREE.Vector3();
    let twist = 0;
    let spin = 0;
    let lift = reduce ? 0 : DROP;
    let dropStart = null;

    const layout = () => {
      for (let i = 0; i <= LINKS; i++) {
        points[i].set(anchor.x, anchor.y + lift - i * LINK, 0);
        prev[i].copy(points[i]);
      }
      // Start a little off to the side so it swings once it lands.
      tip.copy(points[LINKS]).add(new THREE.Vector3(0.5, -1, 0).normalize().multiplyScalar(HANG));
      tipPrev.copy(tip);
    };

    let visW = 1;
    let visH = 1;
    const resize = () => {
      const { width, height } = wrap.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      // On narrow screens the camera backs off so the card stays under a
      // share of the width.
      const tan = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
      camera.position.z = Math.max(CAMERA_Z, CARD_W / (MAX_WIDTH_SHARE * 2 * tan * camera.aspect));
      camera.updateProjectionMatrix();
      visH = 2 * camera.position.z * tan;
      visW = visH * camera.aspect;
      anchor.set((anchorX - 0.5) * visW, visH / 2 + 0.1, 0);
    };
    resize();
    layout();

    // Dragging

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const target = new THREE.Vector3();
    const grab = new THREE.Vector3();
    const hitPoint = new THREE.Vector3();
    let dragging = false;
    let hovering = false;

    const pointer = (e) => {
      const r = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
    };
    const hitsCard = () => raycaster.intersectObject(cardMesh, false).length > 0;
    const setCursor = (value) => {
      document.documentElement.style.cursor = value;
    };

    const onDown = (e) => {
      if (e.button !== 0) return;
      pointer(e);
      if (!hitsCard() || !raycaster.ray.intersectPlane(plane, hitPoint)) return;
      e.preventDefault();
      dragging = true;
      grab.subVectors(tip, hitPoint);
      target.copy(tip);
      setCursor("grabbing");
    };
    const onMove = (e) => {
      pointer(e);
      if (dragging) {
        if (raycaster.ray.intersectPlane(plane, hitPoint)) target.addVectors(hitPoint, grab);
        return;
      }
      const over = hitsCard();
      if (over !== hovering) {
        hovering = over;
        setCursor(over ? "grab" : "");
      }
    };
    // A finger on the card drags it instead of scrolling the page; anywhere
    // else the page scrolls as usual.
    const onTouch = (e) => {
      if (e.touches.length !== 1) return;
      pointer(e.touches[0]);
      if (hitsCard()) e.preventDefault();
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      setCursor(hovering ? "grab" : "");
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("touchstart", onTouch, { passive: false });

    // Simulation

    const tmp = new THREE.Vector3();
    const vel = new THREE.Vector3();
    const reach = LINKS * LINK + HANG - 0.02;

    const step = (time) => {
      points[0].set(anchor.x, anchor.y + lift, 0);

      for (let i = 1; i <= LINKS; i++) {
        vel.subVectors(points[i], prev[i]).multiplyScalar(DAMPING);
        prev[i].copy(points[i]);
        points[i].add(vel);
        points[i].y -= GRAVITY * STEP * STEP;
      }

      if (dragging) {
        // Never pull the strap past its full length.
        tmp.subVectors(target, points[0]);
        if (tmp.length() > reach) target.copy(points[0]).addScaledVector(tmp.normalize(), reach);
        tipPrev.copy(tip);
        tip.lerp(target, 0.3);
      } else {
        vel.subVectors(tip, tipPrev).multiplyScalar(DAMPING);
        tipPrev.copy(tip);
        tip.add(vel);
        tip.y -= GRAVITY * STEP * STEP;
        if (!reduce) tip.x += (Math.sin(time * 0.8) * 0.5 + Math.sin(time * 2.3) * 0.2) * STEP * STEP;
      }

      for (let k = 0; k < ITERATIONS; k++) {
        for (let i = 0; i < LINKS; i++) solve(points[i], points[i + 1], LINK, i === 0 ? 0 : 1, 1, tmp);
        solve(points[LINKS], tip, HANG, 1, dragging ? 0 : CARD_INV_MASS, tmp);
      }

      // Sideways motion pushes air against the card and turns it.
      const swing = (tip.x - tipPrev.x) / STEP;
      const breeze = reduce ? 0 : Math.sin(time * 0.5) * 0.4;
      spin += (swing * TWIST_FROM_SWING + breeze - TWIST_SPRING * twist - TWIST_DAMPING * spin) * STEP;
      twist += spin * STEP;
    };

    // Rendering

    const down = new THREE.Vector3();
    const qHang = new THREE.Quaternion();
    const qTwist = new THREE.Quaternion();
    const yAxis = new THREE.Vector3(0, 1, 0);
    const negY = new THREE.Vector3(0, -1, 0);
    const normal = new THREE.Vector3();
    const curve = new THREE.CatmullRomCurve3(points.map((p) => p.clone()));
    const samples = Array.from({ length: STRAP_SAMPLES }, () => new THREE.Vector3());
    const tangent = new THREE.Vector3();
    const side = new THREE.Vector3();
    const across = new THREE.Vector3();
    const zAxis = new THREE.Vector3(0, 0, 1);

    const draw = () => {
      down.subVectors(tip, points[LINKS]).normalize();
      qHang.setFromUnitVectors(negY, down);
      qTwist.setFromAxisAngle(yAxis, twist);
      card.position.copy(points[LINKS]);
      card.quaternion.copy(qHang).multiply(qTwist);

      // Flat colours, slightly darker as a face turns away from the camera.
      normal.set(0, 0, 1).applyQuaternion(card.quaternion);
      frontMat.color.setScalar(0.72 + 0.28 * Math.max(normal.z, 0));
      backMat.color.setScalar(0.72 + 0.28 * Math.max(-normal.z, 0));

      points.forEach((p, i) => curve.points[i].copy(p));
      for (let i = 0; i < STRAP_SAMPLES; i++) curve.getPoint(i / (STRAP_SAMPLES - 1), samples[i]);
      let length = 0;
      for (let i = 0; i < STRAP_SAMPLES; i++) {
        const a = samples[Math.max(i - 1, 0)];
        const b = samples[Math.min(i + 1, STRAP_SAMPLES - 1)];
        tangent.subVectors(b, a).normalize();
        side.crossVectors(tangent, zAxis).normalize();
        // The strap twists along with the card, more towards the clip.
        const angle = twist * (i / (STRAP_SAMPLES - 1));
        across.crossVectors(tangent, side);
        side.multiplyScalar(Math.cos(angle)).addScaledVector(across, Math.sin(angle)).multiplyScalar(STRAP_W / 2);
        if (i > 0) length += samples[i].distanceTo(samples[i - 1]);
        const s = samples[i];
        strapPos.set([s.x - side.x, s.y - side.y, s.z - side.z, s.x + side.x, s.y + side.y, s.z + side.z], i * 6);
        const v = length / strapRepeat;
        strapUv.set([0, v, 1, v], i * 4);
      }
      strapGeo.attributes.position.needsUpdate = true;
      strapGeo.attributes.uv.needsUpdate = true;

      renderer.render(scene, camera);
    };

    let frame = 0;
    let last = performance.now();
    let acc = 0;
    let visible = true;
    const loop = (now) => {
      frame = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      if (!visible) return;

      if (lift > 0 && readyRef.current) {
        if (dropStart === null) dropStart = now;
        const t = Math.min((now - dropStart) / 1000 / DROP_TIME, 1);
        lift = DROP * Math.pow(1 - t, 3);
      }

      acc += dt;
      while (acc >= STEP) {
        step(now / 1000);
        acc -= STEP;
      }
      draw();
    };
    frame = requestAnimationFrame(loop);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrap);
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    visibility.observe(wrap);

    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibility.disconnect();
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("touchstart", onTouch);
      setCursor("");
      [cardGeo, clipGeo, strapGeo].forEach((g) => g.dispose());
      [edgeMat, frontMat, backMat, clipMat, strapMat].forEach((m) => m.dispose());
      [front, back, strap].forEach((t) => t.texture.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [reduce, photo, anchorX]);

  return <div ref={wrapRef} className="badge" aria-hidden="true" />;
}
