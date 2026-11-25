"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { Certification } from "@/content/certifications";

/**
 * Certificat en volume : une carte épaisse (recto = image de la
 * certification, verso, tranche métallique) éclairée par un studio, vernie,
 * avec un reflet holographique qui balaie la surface selon l'angle.
 * Glisser pour la faire tourner ; elle revient d'elle-même, avec inertie.
 * Changer de certification la retourne.
 */

const ASPECT = 1.414; // A4 paysage par défaut ; corrigé par l'image réelle

function frontPlaceholder(c: Certification, n: number) {
  const W = 1414;
  const H = 1000;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d")!;
  g.fillStyle = "#f3f2ee";
  g.fillRect(0, 0, W, H);
  g.strokeStyle = "#111";
  g.lineWidth = 3;
  g.strokeRect(46, 46, W - 92, H - 92);
  g.lineWidth = 1;
  g.strokeRect(62, 62, W - 124, H - 124);
  g.fillStyle = "#111";
  g.textAlign = "center";
  g.font = '500 30px "IBM Plex Mono", monospace';
  g.fillText("C E R T I F I C A T I O N", W / 2, 190);
  g.font = 'italic 88px "Instrument Serif", serif';
  g.fillText(c.name ?? "Intitulé à renseigner", W / 2, 380);
  g.font = '400 30px "IBM Plex Mono", monospace';
  g.fillStyle = "#555";
  g.fillText(`ORGANISME — ${c.issuer ?? "à renseigner"}`, W / 2, 500);
  g.fillText(`DATE — ${c.date ?? "à renseigner"}`, W / 2, 550);
  // sceau
  g.strokeStyle = "#111";
  g.lineWidth = 2;
  g.beginPath();
  g.arc(W / 2, 760, 92, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.arc(W / 2, 760, 78, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = "#111";
  g.font = '200 64px "Archivo Variable", sans-serif';
  g.fillText(String(n).padStart(2, "0"), W / 2, 782);
  g.font = '400 20px "IBM Plex Mono", monospace';
  g.fillStyle = "#888";
  g.fillText(`content/certifications.ts → ${c.slug}`, W / 2, H - 92);
  return cv;
}

function backFace(c: Certification) {
  const W = 1414;
  const H = 1000;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d")!;
  g.fillStyle = "#0d0d0d";
  g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(255,255,255,0.08)";
  for (let x = 0; x < W; x += 50) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, H);
    g.stroke();
  }
  g.fillStyle = "#eee";
  g.font = '400 30px "IBM Plex Mono", monospace';
  g.fillText("VERSO", 80, 120);
  g.fillStyle = "#888";
  g.fillText(`IDENTIFIANT — ${c.credentialId ?? "à renseigner"}`, 80, H - 170);
  g.fillText(`VÉRIFICATION — ${c.url ? "en ligne" : "à renseigner"}`, 80, H - 120);
  g.font = '200 300px "Archivo Variable", sans-serif';
  g.fillStyle = "rgba(255,255,255,0.9)";
  g.fillText("YANIS", 80, 560);
  return cv;
}

const SHEEN_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SHEEN_FRAG = /* glsl */ `
varying vec2 vUv;
uniform float uPhase;
uniform float uAmt;
void main() {
  // bande holographique : elle glisse quand la carte tourne
  float t = (vUv.x * 0.8 + vUv.y * 0.6) - uPhase;
  float band = exp(-pow(t / 0.08, 2.0)) + 0.35 * exp(-pow((t - 0.22) / 0.03, 2.0));
  // fines stries, comme une feuille métallisée
  float lines = 0.5 + 0.5 * sin((vUv.x + vUv.y * 0.3) * 900.0);
  float a = band * (0.55 + 0.45 * lines) * uAmt;
  gl_FragColor = vec4(vec3(1.0), a);
}`;

export function CertViewer({ certs, index }: { certs: Certification[]; index: number }) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{ show: (i: number) => void } | null>(null);

  useEffect(() => {
    const el = host.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      el.classList.add("no-gl");
      return;
    }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.82;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = "pan-y";

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.55;
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    camera.position.set(0, 0, 9);

    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(-3, 4, 5);
    scene.add(key);

    const W = 3.4;
    const D = 0.045;
    const geo = new THREE.BoxGeometry(W, W / ASPECT, D);
    const edge = new THREE.MeshPhysicalMaterial({ color: 0xd8d8d8, metalness: 1, roughness: 0.22 });
    const front = new THREE.MeshPhysicalMaterial({ roughness: 0.55, clearcoat: 0.7, clearcoatRoughness: 0.18 });
    const back = new THREE.MeshPhysicalMaterial({ roughness: 0.5, clearcoat: 0.6, clearcoatRoughness: 0.2 });
    // ordre BoxGeometry : +x, -x, +y, -y, +z (recto), -z (verso)
    const card = new THREE.Mesh(geo, [edge, edge, edge, edge, front, back]);
    const sheenMat = new THREE.ShaderMaterial({
      vertexShader: SHEEN_VERT,
      fragmentShader: SHEEN_FRAG,
      uniforms: { uPhase: { value: 0 }, uAmt: { value: 0.22 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const sheen = new THREE.Mesh(new THREE.PlaneGeometry(W, W / ASPECT), sheenMat);
    sheen.position.z = D / 2 + 0.001;
    const group = new THREE.Group();
    group.add(card, sheen);
    scene.add(group);

    // ombre douce au sol
    const sh = document.createElement("canvas");
    sh.width = sh.height = 128;
    const sg = sh.getContext("2d")!;
    const rg = sg.createRadialGradient(64, 64, 0, 64, 64, 64);
    rg.addColorStop(0, "rgba(0,0,0,0.55)");
    rg.addColorStop(1, "rgba(0,0,0,0)");
    sg.fillStyle = rg;
    sg.fillRect(0, 0, 128, 128);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 1.1),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sh), transparent: true, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -1.75;
    scene.add(shadow);

    const loader = new THREE.TextureLoader();
    const cache = new Map<number, { front: THREE.Texture; back: THREE.Texture; aspect: number }>();
    const texFor = (i: number) => {
      const hit = cache.get(i);
      if (hit) return hit;
      const c = certs[i];
      const bt = new THREE.CanvasTexture(backFace(c));
      bt.colorSpace = THREE.SRGBColorSpace;
      let entry: { front: THREE.Texture; back: THREE.Texture; aspect: number };
      if (c.image) {
        const ft = loader.load(c.image, (t) => {
          const img = t.image as HTMLImageElement;
          entry.aspect = img.naturalWidth / img.naturalHeight;
          if (current === i) fit(entry.aspect);
        });
        ft.colorSpace = THREE.SRGBColorSpace;
        ft.anisotropy = renderer.capabilities.getMaxAnisotropy();
        entry = { front: ft, back: bt, aspect: ASPECT };
      } else {
        const ft = new THREE.CanvasTexture(frontPlaceholder(c, i + 1));
        ft.colorSpace = THREE.SRGBColorSpace;
        ft.anisotropy = renderer.capabilities.getMaxAnisotropy();
        entry = { front: ft, back: bt, aspect: ASPECT };
      }
      cache.set(i, entry);
      return entry;
    };
    const fit = (aspect: number) => {
      const h = W / aspect;
      card.scale.set(1, h / (W / ASPECT), 1);
      sheen.scale.set(1, h / (W / ASPECT), 1);
    };
    let current = -1;
    const apply = (i: number) => {
      const t = texFor(i);
      front.map = t.front;
      back.map = t.back;
      front.needsUpdate = back.needsUpdate = true;
      current = i;
      fit(t.aspect);
    };

    /* ---- interaction ---- */
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const st = { yaw: 0, pitch: 0, vy: 0, vp: 0, drag: false, lx: 0, ly: 0, hx: 0, hy: 0, flip: 1, next: -1 };
    const dom = renderer.domElement;
    const down = (e: PointerEvent) => {
      st.drag = true;
      st.lx = e.clientX;
      st.ly = e.clientY;
      dom.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      const r = dom.getBoundingClientRect();
      st.hx = ((e.clientX - r.left) / r.width) * 2 - 1;
      st.hy = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (!st.drag) return;
      st.vy = (e.clientX - st.lx) * 0.012;
      st.vp = (e.clientY - st.ly) * 0.008;
      st.yaw += st.vy;
      st.pitch = Math.max(-1.1, Math.min(1.1, st.pitch + st.vp));
      st.lx = e.clientX;
      st.ly = e.clientY;
    };
    const up = () => (st.drag = false);
    dom.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);

    api.current = {
      show: (i: number) => {
        if (i === current && st.flip >= 1) return;
        if (current < 0 || reduced) {
          apply(i);
          return;
        }
        st.next = i;
        st.flip = 0;
      },
    };

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = w / h;
      // la carte tient dans le cadre, quel que soit le format
      camera.position.z = Math.max(8.5, 8.5 / Math.min(1, camera.aspect * 0.95));
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    let raf = 0;
    let last = performance.now();
    let time = 0;
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += dt;

      if (!st.drag) {
        // inertie, puis retour doux vers une pose légèrement inclinée
        st.yaw += st.vy;
        st.vy *= Math.exp(-3.5 * dt);
        const restYaw = Math.round(st.yaw / (Math.PI * 2)) * Math.PI * 2 + (reduced ? 0 : Math.sin(time * 0.4) * 0.12) + st.hx * 0.18;
        const restPitch = (reduced ? 0 : Math.sin(time * 0.3) * 0.05) + st.hy * 0.12;
        if (Math.abs(st.vy) < 0.004) st.yaw += (restYaw - st.yaw) * (1 - Math.exp(-2.4 * dt));
        st.pitch += (restPitch - st.pitch) * (1 - Math.exp(-2.4 * dt));
      }

      // retournement : la carte part sur la tranche, change de face, revient
      let flipYaw = 0;
      if (st.flip < 1) {
        st.flip = Math.min(1, st.flip + dt / 0.95);
        const e = ease(st.flip);
        if (e < 0.5) flipYaw = e * Math.PI;
        else {
          if (st.next >= 0) {
            apply(st.next);
            st.next = -1;
          }
          flipYaw = -(1 - e) * Math.PI;
        }
      }

      group.rotation.set(st.pitch, st.yaw + flipYaw, 0);
      group.position.y = reduced ? 0 : Math.sin(time * 0.8) * 0.05;
      shadow.scale.setScalar(1 - group.position.y * 0.4);
      sheenMat.uniforms.uPhase.value = 0.65 + Math.sin(group.rotation.y) * 0.9 + group.rotation.x * 0.4;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      dom.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      renderer.dispose();
      pmrem.dispose();
      el.removeChild(dom);
      api.current = null;
    };
  }, [certs]);

  useEffect(() => {
    // attend que les polices soient prêtes pour dessiner les cartes neutres
    document.fonts.ready.then(() => api.current?.show(index));
  }, [index]);

  return <div ref={host} className="relative h-full w-full cursor-grab active:cursor-grabbing" data-cursor="Tourner" />;
}
