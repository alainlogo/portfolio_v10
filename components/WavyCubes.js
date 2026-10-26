import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

// A floor of white cubes seen from above. The pointer leaves a trail of
// points, each sending out a ring-shaped wave that lifts the cubes and tints
// their tops blue. When the pointer rests, waves start at random spots.
// Adapted from Arkon's "Wavy Cubes" (projects.arkon.digital/threejs/wavy-cubes).

const GRID = 40;
const CUBE_W = 0.8;
const CUBE_H = 3;
const GAP = 0.01;
const BOUNDS = GRID * (CUBE_W + GAP);
const TRAIL_MAX = 128;
const TRAIL_SPACING = 0.1;
const FADE_TIME = 2;
const CAMERA_RADIUS = 12;
const ALPHA_RANGE = Math.PI * 0.03;
const BETA_RANGE = Math.PI * 0.05;

const wave = {
  uWaveSpeed: 6,
  uWaveFreq: 1.2,
  uWaveWidth: 3,
  uAmplitude: 0.4,
  uJitter: 0.2,
  uMaxHeight: 0.4,
};

const vertexHead = /* glsl */ `#include <common>
varying float vHeight;
attribute vec2 aOffset;
uniform sampler2D uTrailTexture;
uniform int uTrailCount;
uniform float uWaveSpeed;
uniform float uWaveFreq;
uniform float uWaveWidth;
uniform float uFadeTime;
uniform float uAmplitude;
uniform float uJitter;
uniform float uMaxHeight;

// Stable per-cube offsets in [-0.5, 0.5], so the wave fronts look hand-made.
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453123) - 0.5;
}`;

const vertexBody = /* glsl */ `#include <begin_vertex>
vHeight = 0.0;
// Only the top face moves, so the cube stretches instead of floating.
if (position.y > 0.0) {
  vec2 worldXZ = aOffset + hash2(aOffset) * uJitter;
  float height = 0.0;
  float total = 0.0;
  for (int i = 0; i < uTrailCount; i++) {
    // Each texel holds one trail point: x, z, age, distance from the last one.
    vec4 td = texture2D(uTrailTexture, vec2((float(i) + 0.5) / ${TRAIL_MAX}.0, 0.5));
    float dist = length(worldXZ - td.rg);
    float rel = dist - uWaveSpeed * td.b;
    float window = exp(-(rel * rel) / (uWaveWidth * uWaveWidth));
    float weight = exp(-td.b / uFadeTime) * window / (1.0 + dist * 0.1) * td.a;
    height += weight * cos(uWaveFreq * rel);
    total += weight;
  }
  // Overlapping waves average out instead of piling up.
  height /= max(total, 1.0);
  float lift = clamp(height * uAmplitude, -uMaxHeight, uMaxHeight);
  transformed.y += lift;
  vHeight = lift;
}`;

// Chromatic split and darkening that grow towards the corners.
const VignetteShift = {
  uniforms: {
    tDiffuse: { value: null },
    shiftAmount: { value: 0.005 },
    vignetteRadius: { value: 0.3 },
    vignetteSoftness: { value: 0.3 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float shiftAmount;
    uniform float vignetteRadius;
    uniform float vignetteSoftness;
    varying vec2 vUv;
    void main() {
      vec2 center = vec2(0.5);
      float edge = smoothstep(vignetteRadius, vignetteRadius + vignetteSoftness, distance(vUv, center));
      vec2 shift = shiftAmount * edge * vec2(sign(vUv.x - center.x), sign(vUv.y - center.y));
      float r = texture2D(tDiffuse, vUv + shift).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - shift).b;
      gl_FragColor = vec4(vec3(r, g, b) * (1.0 - edge * 0.5), 1.0);
    }`,
};

export default function WavyCubes({ color = "#1f2bd6", reduce = false }) {
  const wrapRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.95;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#ffffff").multiplyScalar(0.5);

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
    camera.up.set(0, 0, -1);
    const placeCamera = (mx, my) => {
      const a = my * ALPHA_RANGE;
      const b = mx * BETA_RANGE;
      camera.position.set(
        -CAMERA_RADIUS * Math.cos(a) * Math.sin(b),
        CAMERA_RADIUS * Math.cos(a) * Math.cos(b),
        CAMERA_RADIUS * Math.sin(a)
      );
      camera.lookAt(0, 0, 0);
    };
    placeCamera(0, 0);

    // Lights: a key light that casts the shadows, a soft fill, and ambient.
    scene.add(new THREE.AmbientLight("#ffffff", 0.5));
    const key = new THREE.DirectionalLight("#ffffff", 4);
    key.position.set(-20, 10, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.radius = 6;
    key.shadow.bias = 1e-4;
    Object.assign(key.shadow.camera, { near: 0.1, far: 60, left: -22, right: 22, top: 22, bottom: -22 });
    scene.add(key);
    const fill = new THREE.DirectionalLight("#ffffff", 1);
    fill.position.set(10, 5, -3);
    scene.add(fill);

    // Trail of pointer positions, handed to the shaders as a 128×1 texture.
    const trail = [];
    const trailData = new Float32Array(TRAIL_MAX * 4);
    const trailTexture = new THREE.DataTexture(trailData, TRAIL_MAX, 1, THREE.RGBAFormat, THREE.FloatType);
    trailTexture.needsUpdate = true;
    const shared = {
      uTrailTexture: { value: trailTexture },
      uTrailCount: { value: 0 },
      uFadeTime: { value: FADE_TIME },
    };
    const waveUniforms = Object.fromEntries(Object.entries(wave).map(([k, v]) => [k, { value: v }]));

    const patch = (shader) => {
      Object.assign(shader.uniforms, shared, waveUniforms);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", vertexHead)
        .replace("#include <begin_vertex>", vertexBody);
    };

    const geometry = new THREE.BoxGeometry(CUBE_W, CUBE_H, CUBE_W);
    const offsets = new THREE.InstancedBufferAttribute(new Float32Array(GRID * GRID * 2), 2);
    geometry.setAttribute("aOffset", offsets);

    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    material.onBeforeCompile = (shader) => {
      patch(shader);
      shader.uniforms.uColorBase = { value: new THREE.Color("#ffffff") };
      shader.uniforms.uColorHigh = { value: new THREE.Color(color) };
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
varying float vHeight;
uniform vec3 uColorBase;
uniform vec3 uColorHigh;
uniform float uMaxHeight;`
        )
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
diffuseColor.rgb = mix(uColorBase, uColorHigh, clamp(vHeight / uMaxHeight, 0.0, 1.0));`
        );
    };
    // The shadow pass needs the same displacement, or shadows lag the cubes.
    const depthMaterial = new THREE.MeshDepthMaterial();
    depthMaterial.onBeforeCompile = patch;

    const cubes = new THREE.InstancedMesh(geometry, material, GRID * GRID);
    cubes.customDepthMaterial = depthMaterial;
    cubes.castShadow = true;
    cubes.receiveShadow = true;
    const dummy = new THREE.Object3D();
    const step = CUBE_W + GAP;
    const half = ((GRID - 1) * step) / 2;
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const i = r * GRID + c;
        const x = r * step - half;
        const z = c * step - half;
        dummy.position.set(x, 0, z);
        dummy.updateMatrix();
        cubes.setMatrixAt(i, dummy.matrix);
        offsets.setXY(i, x, z);
      }
    }
    scene.add(cubes);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new ShaderPass(VignetteShift));
    composer.addPass(new OutputPass());

    const resize = () => {
      const { width, height } = wrap.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();

    // Pointer: the camera leans towards it, and it draws the trail where its
    // ray meets the floor.
    const mouse = new THREE.Vector2();
    const eased = new THREE.Vector2();
    const ndc = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();
    let last = null;
    let idle = 0;
    let randomTimer = 0;
    let randomWaves = true;

    const push = (x, z, strength) => {
      if (trail.length >= TRAIL_MAX) trail.shift();
      trail.push({ x, z, age: 0, strength });
    };

    const onMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (e.clientY < rect.top || e.clientY > rect.bottom) return;
      mouse.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      if (reduce) return;
      ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      if (!raycaster.ray.intersectPlane(floor, hit)) return;
      let moved = 0;
      if (last) {
        moved = Math.hypot(hit.x - last.x, hit.z - last.z);
        if (moved < TRAIL_SPACING) return;
      }
      push(hit.x, hit.z, moved);
      last = { x: hit.x, z: hit.z };
      idle = 0;
      randomWaves = false;
      randomTimer = 0;
    };
    window.addEventListener("pointermove", onMove);

    const updateTrail = (dt) => {
      for (let i = trail.length - 1; i >= 0; i--) {
        trail[i].age += dt;
        if (trail[i].age > FADE_TIME * 4) trail.splice(i, 1);
      }
      if (!reduce) {
        idle += dt;
        if (idle >= 3 && !randomWaves) {
          randomWaves = true;
          randomTimer = 0;
        }
        if (randomWaves) {
          randomTimer += dt;
          if (randomTimer >= 1.5) {
            push((Math.random() * 0.5 - 0.25) * BOUNDS, (Math.random() * 0.5 - 0.25) * BOUNDS, 0.8 + Math.random() * 0.2);
            randomTimer = 0;
          }
        }
      }
      const count = Math.min(trail.length, TRAIL_MAX);
      if (count > 0 || shared.uTrailCount.value > 0) {
        for (let i = 0; i < count; i++) {
          trailData.set([trail[i].x, trail[i].z, trail[i].age, trail[i].strength], i * 4);
        }
        trailTexture.needsUpdate = true;
        shared.uTrailCount.value = count;
      }
    };

    let frame = 0;
    let then = performance.now();
    let visible = true;
    const loop = (now) => {
      frame = requestAnimationFrame(loop);
      const dt = Math.min((now - then) / 1000, 1 / 30);
      then = now;
      if (!visible) return;
      eased.lerp(mouse, 0.04);
      placeCamera(eased.x, eased.y);
      updateTrail(dt);
      composer.render(dt);
    };
    frame = requestAnimationFrame(loop);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrap);
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    visibility.observe(wrap);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibility.disconnect();
      window.removeEventListener("pointermove", onMove);
      geometry.dispose();
      material.dispose();
      depthMaterial.dispose();
      trailTexture.dispose();
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [color, reduce]);

  return <div ref={wrapRef} className="wavy_cubes" aria-hidden="true" />;
}
