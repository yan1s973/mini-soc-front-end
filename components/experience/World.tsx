"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useUI } from "@/lib/store";
import { TIER } from "@/lib/device";
import { flankShaders, tableShaders, terrainShaders, waterShaders } from "@/components/shaders";
import { Director, type Uniforms } from "./Director";

function flankGeometry(n: number) {
  const g = new THREE.BufferGeometry();
  const count = 4 * (n + 1) * 2;
  const pos = new Float32Array(count * 3);
  const aT = new Float32Array(count);
  const aTop = new Float32Array(count);
  const aSide = new Float32Array(count);
  const index: number[] = [];
  let v = 0;
  for (let side = 0; side < 4; side++) {
    const base = v;
    for (let i = 0; i <= n; i++) {
      const t = -1 + (2 * i) / n;
      for (let top = 0; top < 2; top++) {
        aT[v] = t;
        aTop[v] = top;
        aSide[v] = side;
        v++;
      }
    }
    for (let i = 0; i < n; i++) {
      const a = base + i * 2;
      index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aT", new THREE.BufferAttribute(aT, 1));
  g.setAttribute("aTop", new THREE.BufferAttribute(aTop, 1));
  g.setAttribute("aSide", new THREE.BufferAttribute(aSide, 1));
  g.setIndex(index);
  return g;
}

export function World() {
  const tier = useUI((s) => s.tier);
  const field = useUI((s) => s.nameField)!;
  const { segments, oct } = TIER[tier];

  const uniforms: Uniforms = useMemo(() => {
    const tex = new THREE.DataTexture(field.data, field.width, field.height, THREE.RedFormat, THREE.UnsignedByteType);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    return {
      uName: { value: tex },
      uW: { value: [1, 1, 0, 0, 0, 0] },
      uWB: { value: [1, 1, 0, 0, 0, 0] },
      uMix: { value: 0 },
      uLiqA: { value: 0 },
      uLiqB: { value: 0 },
      uTime: { value: 0 },
      uGrow: { value: 0 },
      uGrowDepth: { value: 0 },
      uLens: { value: new THREE.Vector3(0, 0, 0) },
      uLensLift: { value: 0.03 },
      uCut: { value: 1.001 },
      uWater: { value: 0 },
      uLiquid: { value: 0 },
      uDusk: { value: 0 },
      uPulse: { value: new THREE.Vector4(0, 0, -100, 0) },
      uHi: { value: -1 },
      uInk: { value: 0 },
    };
  }, [field]);

  const { terrain, flanks, water, table, geo } = useMemo(() => {
    const t = terrainShaders(segments, oct);
    const f = flankShaders(segments, oct);
    const w = waterShaders(segments, oct);
    const tb = tableShaders();
    const terrainGeo = new THREE.PlaneGeometry(2, 2, segments, segments).rotateX(-Math.PI / 2);
    return {
      terrain: new THREE.ShaderMaterial({ ...t, uniforms }),
      flanks: new THREE.ShaderMaterial({ ...f, uniforms, side: THREE.DoubleSide }),
      water: new THREE.ShaderMaterial({ ...w, uniforms, transparent: true, depthWrite: false }),
      table: new THREE.ShaderMaterial({ ...tb, uniforms, transparent: true, depthWrite: false }),
      geo: {
        terrain: terrainGeo,
        flanks: flankGeometry(segments),
        water: new THREE.PlaneGeometry(2, 2, 1, 1).rotateX(-Math.PI / 2),
        table: new THREE.PlaneGeometry(16, 16, 1, 1).rotateX(-Math.PI / 2),
      },
    };
  }, [segments, oct, uniforms]);

  return (
    <>
      <mesh geometry={geo.table} material={table} position={[0, -0.8, 0]} renderOrder={-1} frustumCulled={false} />
      <mesh geometry={geo.terrain} material={terrain} frustumCulled={false} />
      <mesh geometry={geo.flanks} material={flanks} frustumCulled={false} />
      <mesh geometry={geo.water} material={water} renderOrder={2} frustumCulled={false} />
      <Director uniforms={uniforms} />
    </>
  );
}
