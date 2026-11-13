import { useEffect, useRef, useState } from "react";
import * as T from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import observation from "../../../data/quickmap-observation.json";
import { catalog } from "../../../data/catalog";
export const point = (lat: number, lon: number, r = 1) =>
  new T.Vector3(
    Math.cos((lat * Math.PI) / 180) * Math.cos((lon * Math.PI) / 180) * r,
    Math.sin((lat * Math.PI) / 180) * r,
    -Math.cos((lat * Math.PI) / 180) * Math.sin((lon * Math.PI) / 180) * r,
  );
export default function MoonGlobe({
  latitude,
  longitude,
  onSelect,
}: {
  latitude: number;
  longitude: number;
  onSelect: (lat: number, lon: number) => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    focus = useRef<(lat: number, lon: number) => void>(() => {}),
    callback = useRef(onSelect);
  callback.current = onSelect;
  const [failed, setFailed] = useState(false),
    [loaded, setLoaded] = useState(false),
    [rotating, setRotating] = useState(false);
  const spin = useRef(false);
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  async function toggleFullscreen() {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await host.current?.parentElement?.requestFullscreen();
  }
  useEffect(() => {
    spin.current = rotating;
  }, [rotating]);
  useEffect(() => {
    const el = host.current!;
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setClearColor(0, 0);
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive lunar globe: drag to orbit, scroll to zoom, click to choose coordinates",
    );
    renderer.domElement.setAttribute("role", "img");
    el.appendChild(renderer.domElement);
    const scene = new T.Scene(),
      camera = new T.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.copy(point(latitude, longitude, 3.8));
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.minDistance = 1.6;
    controls.maxDistance = 5;
    controls.autoRotateSpeed = 0.5;
    scene.add(new T.AmbientLight(0xe0e0e0, 0.22));
    const light = new T.DirectionalLight(0xffffff, 3.3);
    light.position.set(4, 3, 2);
    scene.add(light);
    const texture = new T.TextureLoader().load(
      "/textures/trek-wac.jpg",
      () => setLoaded(true),
      undefined,
      () => setFailed(true),
    );
    texture.colorSpace = T.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const geometry = new T.SphereGeometry(1, 96, 64),
      material = new T.MeshStandardMaterial({
        map: texture,
        roughness: 1,
        metalness: 0,
      });
    const moon = new T.Mesh(geometry, material);
    scene.add(moon);
    const footprintGeo = new T.BufferGeometry().setFromPoints(
      observation.features[0].geometry.coordinates[0].map(([lon, lat]) =>
        point(lat, lon, 1.005),
      ),
    );
    const footprintMat = new T.LineBasicMaterial({ color: 0xffffff });
    scene.add(new T.Line(footprintGeo, footprintMat));
    const pins: T.Mesh[] = [];
    const pinGeo = new T.SphereGeometry(0.008, 12, 8);
    const pinMat = new T.MeshBasicMaterial({ color: 0x999999 });
    for (const s of catalog) {
      const p = new T.Mesh(pinGeo, pinMat);
      p.position.copy(point(s.latitude, s.longitude, 1.006));
      scene.add(p);
      pins.push(p);
    }
    const activeGeo = new T.SphereGeometry(0.012, 20, 12),
      activeMat = new T.MeshBasicMaterial({ color: 0xffffff }),
      active = new T.Mesh(activeGeo, activeMat);
    scene.add(active);
    let destination: T.Vector3 | null = null;
    focus.current = (lat, lon) => {
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        Math.abs(lat) > 89.999 ||
        Math.abs(lon) > 180
      )
        return;
      spin.current = false;
      setRotating(false);
      active.position.copy(point(lat, lon, 1.012));
      destination = point(lat, lon, 3.8);
      renderer.domElement.dataset.cameraSettled = "false";
    };
    focus.current(latitude, longitude);
    controls.addEventListener("start", () => {
      destination = null;
      spin.current = false;
      setRotating(false);
    });
    let startX = 0,
      startY = 0;
    const down = (e: PointerEvent) => {
      startX = e.clientX;
      startY = e.clientY;
    };
    const raycaster = new T.Raycaster();
    const up = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > 5) return;
      const rect = renderer.domElement.getBoundingClientRect();
      raycaster.setFromCamera(
        new T.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          (-(e.clientY - rect.top) / rect.height) * 2 + 1,
        ),
        camera,
      );
      const hit = raycaster.intersectObject(moon)[0];
      if (hit) {
        const v = hit.point.clone().normalize();
        const lat = (Math.asin(v.y) * 180) / Math.PI,
          lon = (Math.atan2(-v.z, v.x) * 180) / Math.PI;
        callback.current(
          Math.max(-89.999, Math.min(89.999, Number(lat.toFixed(4)))),
          Number(lon.toFixed(4)),
        );
      }
    };
    renderer.domElement.addEventListener("pointerdown", down);
    renderer.domElement.addEventListener("pointerup", up);
    const resize = new ResizeObserver(() => {
      const w = el.clientWidth,
        h = el.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.fov =
        w <= 800
          ? (2 *
              Math.atan(((Math.tan((35 * Math.PI) / 360) * h) / w) * 1.15) *
              180) /
            Math.PI
          : 35;
      if (!document.fullscreenElement) {
        if (w > 800) camera.setViewOffset(w, h, -w * 0.13, -h * 0.04, w, h);
        else camera.setViewOffset(w, h, 0, -h * 0.17, w, h);
      } else camera.clearViewOffset();
      camera.updateProjectionMatrix();
    });
    resize.observe(el);
    let frame = 0;
    let previous = performance.now();
    const animate = (now: number) => {
      const dt = Math.min((now - previous) / 1000, 0.05);
      previous = now;
      if (destination) {
        const rotation = new T.Quaternion().setFromUnitVectors(
          camera.position.clone().normalize(),
          destination.clone().normalize(),
        );
        camera.position
          .applyQuaternion(
            new T.Quaternion().slerp(rotation, 1 - Math.exp(-dt * 5)),
          )
          .setLength(3.8);
        if (camera.position.distanceTo(destination) < 0.003) {
          destination = null;
          renderer.domElement.dataset.cameraSettled = "true";
        }
      }
      controls.autoRotate = spin.current && !destination;
      controls.update();
      // View-relative studio sun: consistent relief while inspecting any location.
      light.position.copy(
        new T.Vector3(-2.5, 2, 4).applyQuaternion(camera.quaternion),
      );
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      controls.dispose();
      footprintGeo.dispose();
      footprintMat.dispose();
      geometry.dispose();
      material.dispose();
      texture.dispose();
      pinGeo.dispose();
      pinMat.dispose();
      activeGeo.dispose();
      activeMat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  useEffect(() => {
    focus.current(latitude, longitude);
  }, [latitude, longitude]);
  return (
    <div className="globe-shell">
      <div className="globe-canvas" ref={host} />
      {failed && (
        <div className="globe-fallback">
          <img
            src="/textures/trek-wac.jpg"
            alt="LROC WAC global lunar mosaic"
          />
          <p>
            3D view unavailable. Select coordinates using the location controls.
          </p>
        </div>
      )}
      {!loaded && !failed && (
        <span className="globe-loading">Loading LROC imagery…</span>
      )}
      <div className="globe-controls">
        <button
          onClick={() => {
            void toggleFullscreen().catch(() => {});
          }}
        >
          {fullscreen ? "Exit full screen" : "Full screen"}
        </button>
        <button onClick={() => setRotating((v) => !v)} disabled={failed}>
          {rotating ? "Pause rotation" : "Rotate Moon"}
        </button>
        <button
          onClick={() => focus.current(latitude, longitude)}
          disabled={failed}
        >
          Focus point
        </button>
      </div>
    </div>
  );
}
