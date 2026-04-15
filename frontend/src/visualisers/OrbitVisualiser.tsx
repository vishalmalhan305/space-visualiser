import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface OrbitData {
  neoId: string;
  name: string;
  semi_major_axis: number;
  eccentricity: number;
  inclination: number;
  ascending_node_longitude: number;
  perihelion_argument: number;
  mean_anomaly: number;
  /** Epoch of osculation in Julian Day Number (TDB). */
  epoch_osculation: number;
}

interface OrbitVisualiserProps {
  orbit: OrbitData;
}

// ── Keplerian helpers ────────────────────────────────────────────────────────

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Newton-Raphson solver for Kepler's equation: M = E - e·sin(E) */
function solveKepler(M: number, e: number): number {
  let E = M;
  for (let j = 0; j < 50; j++) {
    const dE = (M - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-12) break;
  }
  return E;
}

/**
 * Apply the perifocal-to-ecliptic rotation matrix.
 * Angles Omega (Ω), i, omega (ω) must be in radians.
 * Returns [x_ecl, y_ecl, z_ecl] where z_ecl is the ecliptic pole direction.
 */
function perifocalToEcliptic(
  xPf: number,
  yPf: number,
  Omega: number,
  i: number,
  omega: number,
): [number, number, number] {
  const cO = Math.cos(Omega), sO = Math.sin(Omega);
  const ci = Math.cos(i),     si = Math.sin(i);
  const co = Math.cos(omega), so = Math.sin(omega);

  const Pxx =  cO * co - sO * so * ci;
  const Pxy = -cO * so - sO * co * ci;
  const Pyx =  sO * co + cO * so * ci;
  const Pyy = -sO * so + cO * co * ci;
  const Pzx =  si * so;
  const Pzy =  si * co;

  return [
    Pxx * xPf + Pxy * yPf,
    Pyx * xPf + Pyy * yPf,
    Pzx * xPf + Pzy * yPf,
  ];
}

/**
 * Map ecliptic coordinates to Three.js world space.
 * Three.js: Y-up; ecliptic plane = XZ; ecliptic pole = +Y.
 *   three.x = ecl.x,  three.y = ecl.z,  three.z = ecl.y
 */
function eclToThree(xe: number, ye: number, ze: number, scale: number): THREE.Vector3 {
  return new THREE.Vector3(xe * scale, ze * scale, ye * scale);
}

/** Generate points for the full Keplerian orbit path. */
function buildOrbitPath(
  a: number, e: number,
  iDeg: number, OmegaDeg: number, omegaDeg: number,
  scale: number,
  numPoints = 256,
): THREE.Vector3[] {
  const i = toRad(iDeg), Omega = toRad(OmegaDeg), omega = toRad(omegaDeg);
  const points: THREE.Vector3[] = [];
  for (let k = 0; k <= numPoints; k++) {
    const nu = (k / numPoints) * 2 * Math.PI;
    const r = (a * (1 - e * e)) / (1 + e * Math.cos(nu));
    const xPf = r * Math.cos(nu);
    const yPf = r * Math.sin(nu);
    const [xe, ye, ze] = perifocalToEcliptic(xPf, yPf, Omega, i, omega);
    points.push(eclToThree(xe, ye, ze, scale));
  }
  return points;
}

/** Current Julian Day from Unix timestamp. */
function julianDayNow(): number {
  return 2440587.5 + Date.now() / 86400000;
}

/** Compute the asteroid's 3D position at the current date. */
function currentAsteroidPosition(
  a: number, e: number,
  iDeg: number, OmegaDeg: number, omegaDeg: number,
  M0Deg: number, epochJD: number,
  scale: number,
): THREE.Vector3 {
  const jdNow = julianDayNow();
  // Kepler's third law: T (years) = a^1.5 (a in AU) → T (days)
  const tDays = Math.pow(Math.max(a, 0.01), 1.5) * 365.25;
  const n = (2 * Math.PI) / tDays; // mean motion rad/day
  let M = toRad(M0Deg) + n * (jdNow - epochJD);
  M = ((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

  const E = solveKepler(M, e);
  const nu = 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E / 2),
    Math.sqrt(1 - e) * Math.cos(E / 2),
  );
  const r = a * (1 - e * Math.cos(E));
  const xPf = r * Math.cos(nu);
  const yPf = r * Math.sin(nu);

  const i = toRad(iDeg), Omega = toRad(OmegaDeg), omega = toRad(omegaDeg);
  const [xe, ye, ze] = perifocalToEcliptic(xPf, yPf, Omega, i, omega);
  return eclToThree(xe, ye, ze, scale);
}

// ── Component ────────────────────────────────────────────────────────────────

const SCALE = 5; // Three.js units per AU

export function OrbitVisualiser({ orbit }: OrbitVisualiserProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── Renderer ────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x020617);
    container.appendChild(renderer.domElement);

    // ── Scene & Camera ───────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.01,
      2000,
    );
    camera.position.set(12, 9, 12);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4;
    controls.minDistance = 3;
    controls.maxDistance = 60;
    controls.update();

    // ── Ambient light ────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.15));
    const sunLight = new THREE.PointLight(0xfff4e0, 2.5, 120);
    scene.add(sunLight);

    // ── Sun ──────────────────────────────────────────────────────────────────
    const sunGeo  = new THREE.SphereGeometry(0.45, 32, 32);
    const sunMat  = new THREE.MeshBasicMaterial({ color: 0xfdb813 });
    scene.add(new THREE.Mesh(sunGeo, sunMat));

    const glowGeo = new THREE.SphereGeometry(0.65, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xfdb813, transparent: true, opacity: 0.18 });
    scene.add(new THREE.Mesh(glowGeo, glowMat));

    // ── Earth orbit reference (1 AU, circular in ecliptic XZ plane) ──────────
    const earthPts: THREE.Vector3[] = [];
    for (let k = 0; k <= 128; k++) {
      const angle = (k / 128) * 2 * Math.PI;
      earthPts.push(new THREE.Vector3(Math.cos(angle) * SCALE, 0, Math.sin(angle) * SCALE));
    }
    const earthGeo = new THREE.BufferGeometry().setFromPoints(earthPts);
    const earthMat = new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.35 });
    scene.add(new THREE.Line(earthGeo, earthMat));

    // Small Earth dot at vernal equinox direction (Three.js +X = ecliptic +X)
    const earthDotGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const earthDotMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
    const earthDot = new THREE.Mesh(earthDotGeo, earthDotMat);
    earthDot.position.set(SCALE, 0, 0);
    scene.add(earthDot);

    // ── Asteroid orbit path ───────────────────────────────────────────────────
    const {
      semi_major_axis: a, eccentricity: e, inclination: i,
      ascending_node_longitude: Omega, perihelion_argument: omega,
      mean_anomaly: M0, epoch_osculation: epochJD,
    } = orbit;

    const safeA = Math.max(a, 0.01);
    const safeE = Math.min(Math.max(e, 0), 0.999);

    const asteroidPts = buildOrbitPath(safeA, safeE, i, Omega, omega, SCALE);
    const asteroidGeo = new THREE.BufferGeometry().setFromPoints(asteroidPts);
    const asteroidMat = new THREE.LineBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.8 });
    scene.add(new THREE.Line(asteroidGeo, asteroidMat));

    // ── Asteroid marker (current date position) ───────────────────────────────
    const useEpoch = epochJD && epochJD > 0;
    const markerPos = useEpoch
      ? currentAsteroidPosition(safeA, safeE, i, Omega, omega, M0, epochJD, SCALE)
      // Fallback: perihelion position using orbital elements only
      : ((): THREE.Vector3 => {
          const [xe, ye, ze] = perifocalToEcliptic(
            safeA * (1 - safeE), 0,
            toRad(Omega), toRad(i), toRad(omega),
          );
          return eclToThree(xe, ye, ze, SCALE);
        })();

    const markerGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.position.copy(markerPos);
    scene.add(marker);

    // Subtle glow around the marker
    const markerGlowGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const markerGlowMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.3 });
    const markerGlow = new THREE.Mesh(markerGlowGeo, markerGlowMat);
    markerGlow.position.copy(markerPos);
    scene.add(markerGlow);

    // ── Grid ─────────────────────────────────────────────────────────────────
    const grid = new THREE.GridHelper(30, 30, 0x1e293b, 0x0f172a);
    grid.position.y = -0.05;
    scene.add(grid);

    // ── Animation ─────────────────────────────────────────────────────────────
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      // Pulse the marker glow
      const pulse = 0.25 + 0.15 * Math.sin(Date.now() * 0.003);
      markerGlowMat.opacity = pulse;
      renderer.render(scene, camera);
    };
    animate();

    // ── Resize handler ────────────────────────────────────────────────────────
    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
      container.removeChild(renderer.domElement);
      renderer.dispose();
      [sunGeo, glowGeo, earthGeo, earthDotGeo, asteroidGeo, markerGeo, markerGlowGeo].forEach(g => g.dispose());
      [sunMat, glowMat, earthMat, earthDotMat, asteroidMat, markerMat, markerGlowMat].forEach(m => m.dispose());
    };
  }, [orbit]);

  return <div ref={containerRef} className="w-full h-full" />;
}
