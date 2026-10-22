import { useEffect, useRef } from "react";
import * as THREE from "three";

const galaxyVertex = /* glsl */ `
uniform float uSize;
attribute float aScale;
attribute vec3 aRandom;
varying vec3 vColor;
void main(){
  vec4 mv = modelViewMatrix * vec4(position + aRandom, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * aScale * (1.0 / -mv.z);
  vColor = color;
}
`;

const starVertex = /* glsl */ `
uniform float uTime;
uniform float uSize;
attribute float aScale;
varying vec3 vColor;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float twinkle = 0.6 + 0.4 * sin(uTime * 2.0 + aScale * 40.0);
  gl_PointSize = uSize * aScale * twinkle;
  vColor = color;
}
`;

// A soft round dot that fades from a bright centre.
const pointFragment = /* glsl */ `
varying vec3 vColor;
void main(){
  float d = distance(gl_PointCoord, vec2(0.5));
  float strength = pow(1.0 - clamp(d * 2.0, 0.0, 1.0), 3.0);
  gl_FragColor = vec4(vColor * strength, 1.0);
}
`;

function makeGalaxy(count) {
  const branches = 4;
  const radius = 6;
  const inside = new THREE.Color("#ffd8a8");
  const outside = new THREE.Color("#2a35ff");

  const positions = new Float32Array(count * 3);
  const randoms = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const scales = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const r = Math.pow(Math.random(), 1.4) * radius;
    // The further out a star is, the more its arm is bent: that's the spiral.
    const angle = ((i % branches) / branches) * Math.PI * 2 + r * 1.1;
    positions[i * 3] = Math.cos(angle) * r;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = Math.sin(angle) * r;

    // Stars scatter more around the arms the further out they are.
    for (let k = 0; k < 3; k++) {
      const spread = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.6 * (r * 0.45 + 0.5);
      randoms[i * 3 + k] = k === 1 ? spread * 0.4 : spread;
    }

    const c = inside.clone().lerp(outside, r / radius);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
    scales[i] = Math.random();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
  return geometry;
}

function makeStars(count) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  const palette = ["#ededE8", "#bfc6ff", "#ffe2bf"].map((c) => new THREE.Color(c));

  for (let i = 0; i < count; i++) {
    // Spread on a big shell around the scene.
    const v = new THREE.Vector3().randomDirection().multiplyScalar(30 + Math.random() * 30);
    positions.set([v.x, v.y, v.z], i * 3);
    const c = palette[i % palette.length];
    colors.set([c.r, c.g, c.b], i * 3);
    scales[i] = Math.random();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
  return geometry;
}

export default function Scene3D({ className }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.innerWidth < 700;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    const dpr = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(dpr);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);

    const material = (vertexShader, size) =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uSize: { value: size * dpr } },
        vertexShader,
        fragmentShader: pointFragment,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

    const galaxyMaterial = material(galaxyVertex, 60);
    const galaxy = new THREE.Points(makeGalaxy(small ? 30000 : 70000), galaxyMaterial);
    const tilt = new THREE.Group();
    tilt.add(galaxy);
    tilt.rotation.set(0.45, 0, -0.25);
    scene.add(tilt);

    const starMaterial = material(starVertex, 3);
    const stars = new THREE.Points(makeStars(small ? 1500 : 3000), starMaterial);
    scene.add(stars);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      // Keep the core off to the right on wide screens so the title stays clear.
      tilt.position.x = w < 700 ? 0 : 2.2;
      if (reduce) render();
    };

    const pointer = { x: 0, y: 0 };
    const onPointer = (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };

    let visible = true;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });

    const timer = new THREE.Timer();
    const look = new THREE.Vector3();
    let progress = 0;
    let frame;

    function render() {
      timer.update();
      const t = reduce ? 4 : timer.getElapsed();
      const target = Math.min(window.scrollY / window.innerHeight, 1.5);
      progress = reduce ? target : progress + (target - progress) * 0.08;
      // On load the camera arrives from deep space and settles in.
      const intro = reduce ? 0 : Math.pow(Math.max(1 - t / 3, 0), 3);

      starMaterial.uniforms.uTime.value = t;

      // Scrolling flies the camera down into the core of the galaxy.
      const distance = (small ? 13 : 10) - progress * 6 + intro * 25;
      camera.position.x += (pointer.x * 2.5 - camera.position.x) * 0.05;
      camera.position.y += (4 - progress * 3.2 - pointer.y * 1.8 - camera.position.y) * 0.05;
      camera.position.z = distance;
      galaxy.rotation.y = -t * 0.15 - progress * 1.5;
      look.set(tilt.position.x * 0.5, 0, 0);
      camera.lookAt(look);

      stars.rotation.y = t * 0.01 + progress * 0.3;
      renderer.render(scene, camera);
    }

    const loop = () => {
      if (visible) render();
      frame = requestAnimationFrame(loop);
    };

    camera.position.set(0, 4, small ? 13 : 10);
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointer);
    observer.observe(mount);
    if (reduce) render();
    else loop();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      galaxy.geometry.dispose();
      galaxyMaterial.dispose();
      stars.geometry.dispose();
      starMaterial.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className={className} aria-hidden="true" />;
}
