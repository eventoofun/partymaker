"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Props {
  className?: string;
}

export default function HeroCanvas({ className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── Setup ──────────────────────────────────────────────────────────────
    const W = container.clientWidth;
    const H = container.clientHeight;

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // ── Particles ──────────────────────────────────────────────────────────
    const COUNT = 2800;
    const positions = new Float32Array(COUNT * 3);
    const colors    = new Float32Array(COUNT * 3);
    const sizes     = new Float32Array(COUNT);

    // Brand colors: Teal #00C2D1, Gold #FFB300, Blue #0066FF
    const palette = [
      [0.00, 0.76, 0.82], // Teal    – 60%
      [1.00, 0.70, 0.00], // Gold    – 25%
      [0.00, 0.40, 1.00], // Blue    – 15%
    ];

    for (let i = 0; i < COUNT; i++) {
      // Sphere distribution so particles surround the Genio
      const r     = 6 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;

      // Color selection
      const rand = Math.random();
      const col  = rand < 0.60 ? palette[0] : rand < 0.85 ? palette[1] : palette[2];
      colors[i * 3]     = col[0];
      colors[i * 3 + 1] = col[1];
      colors[i * 3 + 2] = col[2];

      sizes[i] = 0.015 + Math.random() * 0.035;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color",    new THREE.BufferAttribute(colors,    3));
    geo.setAttribute("size",     new THREE.BufferAttribute(sizes,     1));

    // Custom shader material for round, glowing particles
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;

        void main() {
          vColor = color;
          // Subtle wave motion
          vec3 pos = position;
          pos.y += sin(uTime * 0.4 + position.x * 0.5) * 0.08;
          pos.x += cos(uTime * 0.3 + position.y * 0.4) * 0.06;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (500.0 / -mvPosition.z);
          gl_Position  = projectionMatrix * mvPosition;
          vAlpha = 0.5 + 0.3 * sin(uTime * 0.6 + position.z * 0.8);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          // Smooth circle with soft glow
          float d = distance(gl_PointCoord, vec2(0.5));
          if (d > 0.5) discard;
          float alpha = (1.0 - smoothstep(0.2, 0.5, d)) * vAlpha;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent:  true,
      depthWrite:   false,
      vertexColors: false,
    });

    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    // ── Ambient glow orb (Genio aura) ─────────────────────────────────────
    const orbGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const orbMat = new THREE.MeshBasicMaterial({
      color: 0x00C2D1,
      transparent: true,
      opacity: 0,
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.set(2, 0, 0);
    scene.add(orb);

    // ── Mouse parallax ─────────────────────────────────────────────────────
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth  - 0.5) * 1.5;
      mouse.y = -(e.clientY / window.innerHeight - 0.5) * 1.0;
    };
    window.addEventListener("mousemove", onMouseMove);

    // ── Animation loop ─────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      mat.uniforms.uTime.value = t;

      // Smooth mouse tracking
      mouse.tx += (mouse.x - mouse.tx) * 0.04;
      mouse.ty += (mouse.y - mouse.ty) * 0.04;

      particles.rotation.x = t * 0.012 + mouse.ty * 0.2;
      particles.rotation.y = t * 0.018 + mouse.tx * 0.2;

      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ─────────────────────────────────────────────────────────────
    const onResize = () => {
      const nW = container.clientWidth;
      const nH = container.clientHeight;
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    };
    window.addEventListener("resize", onResize);

    // ── Cleanup ────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      orbGeo.dispose();
      orbMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
