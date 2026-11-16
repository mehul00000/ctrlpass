"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useScroll, useVelocity } from "framer-motion";
import * as THREE from "three";

const R3FCanvas =
  Canvas as unknown as React.FC<
    React.PropsWithChildren<Record<string, unknown>>
  >;

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  uniform float uScrollVelocity;
  uniform float uMouseStrength;

  varying vec2 vUv;

  float random(vec2 st) {
    return fract(
      sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123
    );
  }

  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x)
      + (c - a) * u.y * (1.0 - u.x)
      + (d - b) * u.x * u.y;
  }

  float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;

    for (int i = 0; i < 6; i++) {
      value += amplitude * noise(st);
      st *= 2.0;
      amplitude *= 0.5;
    }

    return value;
  }

  void main() {
    vec2 uv = vUv;

    float time = uTime * (
      0.72 + min(uScrollVelocity, 2.0) * 0.18
    );

    vec2 mouseDist = uv - uMouse;
    float distanceToMouse = length(mouseDist);

    float ripple =
      sin(distanceToMouse * 28.0 - time * 4.0)
      * exp(-distanceToMouse * 9.0)
      * uMouseStrength;

    float rippleSecondary =
      sin(distanceToMouse * 16.0 - time * 2.5)
      * exp(-distanceToMouse * 6.0)
      * uMouseStrength
      * 0.45;

    float flowSpeed = 0.18 + uScrollVelocity * 0.08;

    vec2 flow = vec2(
      fbm(uv * 2.2 + vec2(time * flowSpeed, time * flowSpeed * 0.65)),
      fbm(uv * 2.2 + vec2(time * flowSpeed * 0.65, time * flowSpeed))
    );

    vec2 distortedUv =
      uv
      + flow * (0.12 + uScrollVelocity * 0.045)
      + vec2(ripple * 0.065 + rippleSecondary * 0.025);

    float metal = fbm(
      distortedUv * 4.5 + time * 0.32
    );

    metal = smoothstep(0.28, 0.72, metal);

    float detail = fbm(
      distortedUv * 9.0 + time * 0.18
    );

    float highlight = smoothstep(
      0.48,
      0.82,
      metal * 0.72 + detail * 0.28
    );

    // CtrlPass palette:
    // deep black / charcoal / warm champagne
    vec3 black = vec3(0.012, 0.012, 0.012);
    vec3 charcoal = vec3(0.055, 0.052, 0.047);
    vec3 champagne = vec3(0.84, 0.706, 0.478);

    vec3 color = mix(
      black,
      charcoal,
      metal * 0.72
    );

    color += champagne * highlight * 0.24;

    float mouseGlow =
      exp(-distanceToMouse * 5.0)
      * uMouseStrength;

    color += champagne * mouseGlow * 0.13;

    float edge = min(
      min(uv.x, uv.y),
      min(1.0 - uv.x, 1.0 - uv.y)
    );

    float vignette = smoothstep(
      0.0,
      0.32,
      edge
    );

    color *= 0.62 + vignette * 0.38;

    float alpha = 0.94;

    gl_FragColor = vec4(color, alpha);
  }
`;

interface LiquidMetalPlaneProps {
  mouse: [number, number];
  scrollVelocity: number;
  mouseStrength: number;
}

function LiquidMetalPlane({
  mouse,
  scrollVelocity,
  mouseStrength,
}: LiquidMetalPlaneProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uResolution: {
        value: new THREE.Vector2(size.width, size.height),
      },
      uScrollVelocity: { value: 0 },
      uMouseStrength: { value: 0 },
    }),
    [size.width, size.height],
  );

  useFrame((state) => {
    if (!materialRef.current) return;

    const uniforms = materialRef.current.uniforms;

    uniforms.uTime.value = state.clock.getElapsedTime();

    uniforms.uMouse.value.lerp(
      new THREE.Vector2(mouse[0], mouse[1]),
      0.12,
    );

    uniforms.uScrollVelocity.value +=
      (scrollVelocity - uniforms.uScrollVelocity.value) * 0.08;

    uniforms.uMouseStrength.value +=
      (mouseStrength - uniforms.uMouseStrength.value) * 0.1;

    uniforms.uResolution.value.set(
      size.width,
      size.height,
    );
  });

  return (
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[10, 10, 128, 128]} />

      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

interface Particle {
  progress: number;
  speed: number;
  x: number;
  y: number;
  z: number;
  size: number;
}

function FloatingParticles({ count = 100 }: { count?: number }) {
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  const { viewport } = useThree();

  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, () => ({
      progress: Math.random(),
      speed: 0.08 + Math.random() * 0.16,
      x: (Math.random() - 0.5) * viewport.width * 1.5,
      y: (Math.random() - 0.5) * viewport.height * 1.5,
      z: Math.random() * 1.5 - 0.75,
      size: 0.008 + Math.random() * 0.018,
    }));
  }, [count, viewport.width, viewport.height]);

  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const scale = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!particlesRef.current) return;

    particles.forEach((particle, index) => {
      particle.progress += particle.speed * 0.008;

      if (particle.progress > 1) {
        particle.progress = 0;
      }

      const y =
        particle.y +
        particle.progress * viewport.height * 0.55;

      const x =
        particle.x +
        Math.sin(particle.progress * Math.PI * 2) * 0.12;

      matrix.identity();
      matrix.setPosition(x, y, particle.z);

      scale.set(
        particle.size,
        particle.size,
        particle.size,
      );

      matrix.scale(scale);

      particlesRef.current?.setMatrixAt(index, matrix);
    });

    particlesRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={particlesRef}
      args={[undefined, undefined, count]}
    >
      <sphereGeometry args={[0.05, 6, 6]} />

      <meshStandardMaterial
        color="#D6B47A"
        emissive="#B88A45"
        emissiveIntensity={0.35}
        transparent
        opacity={0.42}
      />
    </instancedMesh>
  );
}

export const LiquidEventHorizonFooter = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [mouse, setMouse] = useState<[number, number]>([
    0.5,
    0.5,
  ]);

  const [mouseStrength, setMouseStrength] = useState(0);

  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);

  const [
    scrollVelocityNormalized,
    setScrollVelocityNormalized,
  ] = useState(0);

  useEffect(() => {
    const unsubscribe = scrollVelocity.on("change", (latest) => {
      setScrollVelocityNormalized(
        Math.min(Math.abs(latest) * 0.008, 2),
      );
    });

    return unsubscribe;
  }, [scrollVelocity]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMouseStrength((previous) =>
        Math.max(0, previous - 0.025),
      );
    }, 16);

    return () => window.clearInterval(timer);
  }, []);

  const handleMouseMove = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (!containerRef.current) return;

    const rect =
      containerRef.current.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    const x =
      (event.clientX - rect.left) / rect.width;

    const y =
      1 -
      (event.clientY - rect.top) / rect.height;

    setMouse([
      Math.max(0, Math.min(1, x)),
      Math.max(0, Math.min(1, y)),
    ]);

    setMouseStrength(1);
  };

  const handleMouseLeave = () => {
    setMouseStrength(0);
  };

  const LINKS = [
    "Discover",
    "Events",
    "Organizers",
    "About",
  ];

  const SOCIALS = [
    "Instagram",
    "LinkedIn",
    "X",
    "GitHub",
  ];

  return (
    <footer
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-[760px] overflow-hidden bg-[#050505] text-[#F5F5F2] md:min-h-[900px]"
    >
      {/* Liquid WebGL Background */}
      <div className="absolute inset-0 z-0">
        <R3FCanvas
          camera={{
            position: [0, 0, 5],
            fov: 50,
          }}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
          }}
          dpr={[1, 1.5]}
        >
          <ambientLight intensity={0.35} />

          <pointLight
            position={[5, 5, 5]}
            intensity={0.7}
            color="#D6B47A"
          />

          <LiquidMetalPlane
            mouse={mouse}
            scrollVelocity={scrollVelocityNormalized}
            mouseStrength={mouseStrength}
          />

          <FloatingParticles count={100} />
        </R3FCanvas>
      </div>

      {/* Dark readability overlay */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_center,transparent_0%,rgba(5,5,5,0.18)_55%,rgba(5,5,5,0.7)_100%)]" />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-32 bg-gradient-to-b from-[#050505] to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex min-h-[760px] flex-col justify-between p-6 sm:p-8 md:min-h-[900px] md:p-14 lg:p-16">
        {/* Header */}
        <div className="flex items-start justify-between gap-8">
          <div>
            <div className="mb-5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D6B47A] shadow-[0_0_12px_rgba(214,180,122,0.5)]" />

              <span className="font-mono text-[9px] font-medium uppercase tracking-[0.22em] text-[#A7A39B]">
                CtrlPass / Platform
              </span>
            </div>

            <h2 className="max-w-5xl text-[15vw] font-semibold uppercase leading-[0.76] tracking-[-0.075em] text-[#F5F5F2] sm:text-[12vw] md:text-[10vw]">
              <span className="block">Your</span>

              <span className="block text-[#D6B47A]">
                Next
              </span>

              <span className="block">
                Event.
              </span>
            </h2>
          </div>

          <div className="hidden pt-2 text-right md:block">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#77736C]">
              Discover
            </p>

            <p className="mt-2 max-w-[170px] text-xs leading-relaxed text-[#A7A39B]">
              Find. Book. Experience.
              <br />
              Everything in one place.
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4 md:gap-8">
          <div>
            <p className="mb-5 font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-[#77736C]">
              Explore
            </p>

            <div className="flex flex-col">
              {LINKS.map((link, index) => (
                <a
                  key={link}
                  href="#"
                  className="group flex items-center gap-3 border-b border-white/[0.07] py-3 text-xl font-medium tracking-tight text-[#F5F5F2] transition-colors duration-300 first:border-t hover:text-[#D6B47A] sm:text-2xl"
                >
                  <span className="font-mono text-[8px] text-[#55524D] transition-colors group-hover:text-[#D6B47A]">
                    0{index + 1}
                  </span>

                  <span>{link}</span>

                  <span className="ml-auto translate-x-[-4px] text-[#77736C] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:text-[#D6B47A] group-hover:opacity-100">
                    ↗
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="sm:col-start-2 md:col-start-3">
            <p className="mb-5 font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-[#77736C]">
              Connect
            </p>

            <div className="flex flex-col">
              {SOCIALS.map((social) => (
                <a
                  key={social}
                  href="#"
                  className="group flex items-center border-b border-white/[0.07] py-3 text-xl font-medium tracking-tight text-[#F5F5F2] transition-colors duration-300 first:border-t hover:text-[#D6B47A] sm:text-2xl"
                >
                  {social}

                  <span className="ml-auto translate-x-[-4px] text-[#77736C] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:text-[#D6B47A] group-hover:opacity-100">
                    ↗
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col gap-8 border-t border-white/[0.09] pt-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#77736C]">
              © 2026 CtrlPass
            </p>

            <p className="mt-2 max-w-sm text-xs leading-relaxed text-[#A7A39B]">
              Discover experiences worth remembering.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="/events"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6B47A]/25 bg-[#D6B47A] px-6 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#050505] transition-all duration-300 hover:bg-[#E1C38B] hover:shadow-[0_8px_30px_rgba(214,180,122,0.12)]"
            >
              Explore Events
            </a>

            <a
              href="/organizer/events/new"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.025] px-6 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#F5F5F2] backdrop-blur-sm transition-all duration-300 hover:border-[#D6B47A]/30 hover:bg-[#D6B47A]/[0.06] hover:text-[#D6B47A]"
            >
              Create Event
            </a>
          </div>
        </div>
      </div>

      {/* Cursor glow */}
      <div
        className="pointer-events-none absolute inset-0 z-[5] opacity-40 mix-blend-screen"
        style={{
          background: `radial-gradient(
            280px circle at ${mouse[0] * 100}% ${(1 - mouse[1]) * 100}%,
            rgba(214,180,122,0.10),
            transparent 70%
          )`,
        }}
      />
    </footer>
  );
};

export default LiquidEventHorizonFooter;