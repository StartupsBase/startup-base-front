"use client"

import { CSSProperties, ReactNode, useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import { HumayroLoaderLayers } from "@/components/icons/humayro-loader-layers"

type HumayroLoaderProps = {
  children: ReactNode
  duration?: number
  showLoadingText?: boolean
}

type Particle = {
  x: number
  y: number
  size: number
  delay: number
  duration: number
  opacity: number
}

type OrbitParticle = {
  angle: number
  radius: number
  size: number
  delay: number
}

type FlyingLeaf = {
  left: string
  top: string
  width: number
  delay: number
  duration: number
  moveX: number
  moveY: number
  rotate: number
  opacity: number
}

const coreParticles: Particle[] = [
  { x: -8, y: -5, size: 2, delay: 0.0, duration: 1.35, opacity: 1 },
  { x: 12, y: -10, size: 2, delay: 0.03, duration: 1.45, opacity: 0.95 },
  { x: -18, y: 9, size: 2, delay: 0.06, duration: 1.55, opacity: 0.9 },
  { x: 25, y: 14, size: 3, delay: 0.09, duration: 1.65, opacity: 1 },
  { x: -33, y: -17, size: 2, delay: 0.12, duration: 1.75, opacity: 0.95 },
  { x: 39, y: -23, size: 2, delay: 0.15, duration: 1.85, opacity: 0.9 },
  { x: -48, y: 27, size: 3, delay: 0.18, duration: 1.95, opacity: 1 },
  { x: 53, y: 20, size: 2, delay: 0.21, duration: 1.85, opacity: 0.88 },
  { x: -63, y: -4, size: 2, delay: 0.24, duration: 2.0, opacity: 0.95 },
  { x: 68, y: 3, size: 2, delay: 0.27, duration: 2.1, opacity: 0.9 },
  { x: -32, y: 48, size: 2, delay: 0.3, duration: 2.0, opacity: 0.86 },
  { x: 37, y: 55, size: 3, delay: 0.33, duration: 2.15, opacity: 1 },
  { x: -16, y: -61, size: 2, delay: 0.36, duration: 2.05, opacity: 0.9 },
  { x: 20, y: -67, size: 2, delay: 0.39, duration: 2.2, opacity: 0.9 },
  { x: -78, y: 37, size: 2, delay: 0.42, duration: 2.25, opacity: 0.92 },
  { x: 84, y: 41, size: 3, delay: 0.45, duration: 2.3, opacity: 1 },
  { x: -88, y: -45, size: 2, delay: 0.48, duration: 2.35, opacity: 0.85 },
  { x: 94, y: -50, size: 2, delay: 0.51, duration: 2.4, opacity: 0.88 },
  { x: -59, y: 76, size: 2, delay: 0.54, duration: 2.45, opacity: 0.9 },
  { x: 65, y: 83, size: 2, delay: 0.57, duration: 2.5, opacity: 0.9 },
  { x: -103, y: 12, size: 2, delay: 0.6, duration: 2.55, opacity: 0.85 },
  { x: 108, y: 17, size: 2, delay: 0.63, duration: 2.6, opacity: 0.84 },
  { x: -111, y: -58, size: 2, delay: 0.66, duration: 2.65, opacity: 0.82 },
  { x: 117, y: -64, size: 3, delay: 0.69, duration: 2.7, opacity: 0.95 },
  { x: -72, y: 91, size: 2, delay: 0.72, duration: 2.75, opacity: 0.86 },
  { x: 78, y: 97, size: 2, delay: 0.75, duration: 2.8, opacity: 0.86 },
]

const orbitParticles: OrbitParticle[] = Array.from(
  { length: 72 },
  (_, index) => ({
    angle: index * (360 / 72),
    radius: 105 + (index % 6) * 3,
    size: index % 11 === 0 ? 2.4 : index % 4 === 0 ? 1.55 : 1.05,
    delay: 0.46 + index * 0.015,
  })
)

const flyingLeaves: FlyingLeaf[] = [
  {
    left: "7%",
    top: "77%",
    width: 24,
    delay: 2.24,
    duration: 6.9,
    moveX: 130,
    moveY: -180,
    rotate: -42,
    opacity: 0.54,
  },
  {
    left: "16%",
    top: "88%",
    width: 18,
    delay: 2.42,
    duration: 7.25,
    moveX: 110,
    moveY: -220,
    rotate: 32,
    opacity: 0.46,
  },
  {
    left: "30%",
    top: "91%",
    width: 21,
    delay: 2.58,
    duration: 7.0,
    moveX: -72,
    moveY: -190,
    rotate: -72,
    opacity: 0.48,
  },
  {
    left: "69%",
    top: "84%",
    width: 27,
    delay: 2.32,
    duration: 7.1,
    moveX: 95,
    moveY: -205,
    rotate: 52,
    opacity: 0.52,
  },
  {
    left: "83%",
    top: "89%",
    width: 22,
    delay: 2.5,
    duration: 7.45,
    moveX: -140,
    moveY: -220,
    rotate: 82,
    opacity: 0.48,
  },
  {
    left: "92%",
    top: "92%",
    width: 17,
    delay: 2.68,
    duration: 7.05,
    moveX: -150,
    moveY: -230,
    rotate: -86,
    opacity: 0.42,
  },
  {
    left: "2%",
    top: "95%",
    width: 28,
    delay: 2.72,
    duration: 7.3,
    moveX: 165,
    moveY: -250,
    rotate: -55,
    opacity: 0.44,
  },
  {
    left: "11%",
    top: "97%",
    width: 16,
    delay: 2.9,
    duration: 6.8,
    moveX: 116,
    moveY: -205,
    rotate: 48,
    opacity: 0.36,
  },
  {
    left: "23%",
    top: "96%",
    width: 30,
    delay: 3.06,
    duration: 7.45,
    moveX: 54,
    moveY: -270,
    rotate: -18,
    opacity: 0.42,
  },
  {
    left: "43%",
    top: "98%",
    width: 19,
    delay: 3.2,
    duration: 6.95,
    moveX: -45,
    moveY: -235,
    rotate: 68,
    opacity: 0.38,
  },
  {
    left: "56%",
    top: "95%",
    width: 25,
    delay: 2.82,
    duration: 7.2,
    moveX: 74,
    moveY: -255,
    rotate: -34,
    opacity: 0.46,
  },
  {
    left: "74%",
    top: "97%",
    width: 31,
    delay: 3.14,
    duration: 7.55,
    moveX: -98,
    moveY: -275,
    rotate: 42,
    opacity: 0.46,
  },
  {
    left: "88%",
    top: "96%",
    width: 18,
    delay: 3.3,
    duration: 6.85,
    moveX: -132,
    moveY: -212,
    rotate: -74,
    opacity: 0.38,
  },
  {
    left: "97%",
    top: "94%",
    width: 26,
    delay: 3.42,
    duration: 7.25,
    moveX: -190,
    moveY: -248,
    rotate: 76,
    opacity: 0.42,
  },
]

export default function HumayroLoader({
  children,
  duration = 7600,
  showLoadingText = true,
}: HumayroLoaderProps) {
  const pathname = usePathname()

  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)

  const stableCoreParticles = useMemo(() => coreParticles, [])
  const stableOrbitParticles = useMemo(() => orbitParticles, [])

  useEffect(() => {
    setMounted(true)
    setVisible(true)
    setAnimationKey((current) => current + 1)

    const fadeTimer = window.setTimeout(
      () => {
        setVisible(false)
      },
      Math.max(duration - 600, 700)
    )

    const removeTimer = window.setTimeout(() => {
      setMounted(false)
    }, duration)

    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(removeTimer)
    }
  }, [pathname, duration])

  return (
    <>
      {mounted && (
        <div
          key={animationKey}
          className={`fixed inset-0 z-[999999] overflow-hidden transition-opacity duration-500 ${
            visible
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }`}
        >
          <style jsx global>{`
            @keyframes humayroBackgroundBreath {
              0%,
              100% {
                opacity: 0.44;
                transform: translate(-50%, -50%) scale(0.95);
              }
              50% {
                opacity: 0.9;
                transform: translate(-50%, -50%) scale(1.05);
              }
            }

            @keyframes humayroCoreFlash {
              0% {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.05);
              }
              20% {
                opacity: 0.9;
              }
              50% {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
              }
              100% {
                opacity: 0;
                transform: translate(-50%, -50%) scale(2.2);
              }
            }

            @keyframes humayroParticleBurst {
              0% {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0);
              }
              16% {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1.45);
              }
              65% {
                opacity: 0.72;
              }
              100% {
                opacity: 0;
                transform: translate(
                    calc(-50% + var(--particle-x)),
                    calc(-50% + var(--particle-y))
                  )
                  scale(0.05);
              }
            }

            @keyframes humayroOrbitParticle {
              0% {
                opacity: 0;
                transform: rotate(var(--orbit-angle)) translateX(0) scale(0.2);
              }
              24% {
                opacity: 0.85;
              }
              65% {
                opacity: 0.74;
                transform: rotate(calc(var(--orbit-angle) + 95deg))
                  translateX(var(--orbit-radius)) scale(1);
              }
              100% {
                opacity: 0;
                transform: rotate(calc(var(--orbit-angle) + 210deg))
                  translateX(var(--orbit-radius)) scale(0.3);
              }
            }

            @keyframes humayroEnergyRingDraw {
              0% {
                opacity: 0;
                stroke-dashoffset: 900;
                filter: blur(6px);
              }
              18% {
                opacity: 0.95;
              }
              100% {
                opacity: 1;
                stroke-dashoffset: 0;
                filter: blur(0);
              }
            }

            @keyframes humayroEnergyRingRotate {
              from {
                transform: rotate(-55deg);
              }
              to {
                transform: rotate(305deg);
              }
            }

            @keyframes humayroEnergyRingFade {
              0%,
              62% {
                opacity: 0.95;
              }
              100% {
                opacity: 0;
              }
            }

            @keyframes humayroBranchReveal {
              0% {
                opacity: 0;
                transform: translate(-15px, 18px) scale(0.58) rotate(-7deg);
              }
              74% {
                opacity: 1;
                transform: translate(1px, -1px) scale(1.035) rotate(0.8deg);
              }
              100% {
                opacity: 1;
                transform: translate(0, 0) scale(1) rotate(0);
              }
            }

            @keyframes humayroLeafGrow {
              0% {
                opacity: 0;
                transform: scale(0.05) rotate(-22deg);
              }
              76% {
                opacity: 1;
                transform: scale(1.08) rotate(2deg);
              }
              100% {
                opacity: 1;
                transform: scale(1) rotate(0);
              }
            }

            @keyframes humayroProfileDraw {
              0% {
                opacity: 0;
                stroke-dashoffset: 1100;
              }
              10% {
                opacity: 0.9;
              }
              100% {
                opacity: 1;
                stroke-dashoffset: 0;
              }
            }

            @keyframes humayroMoonReveal {
              0% {
                opacity: 0;
                transform: scale(0.55) rotate(-18deg);
                filter: blur(12px);
              }
              74% {
                opacity: 1;
                transform: scale(1.03) rotate(1deg);
                filter: blur(0.8px);
              }
              100% {
                opacity: 1;
                transform: scale(1) rotate(0);
                filter: blur(0);
              }
            }

            @keyframes humayroStarReveal {
              0% {
                opacity: 0;
                transform: scale(0) rotate(-65deg);
              }
              76% {
                opacity: 1;
                transform: scale(1.2) rotate(7deg);
              }
              100% {
                opacity: 1;
                transform: scale(1) rotate(0);
              }
            }

            @keyframes humayroStarPulse {
              0%,
              100% {
                opacity: 0.78;
                transform: scale(0.9);
              }
              50% {
                opacity: 1;
                transform: scale(1.1);
              }
            }

            @keyframes humayroTitleReveal {
              0% {
                opacity: 0;
                filter: blur(9px);
                letter-spacing: 24px;
                transform: translateY(18px) scale(0.95);
              }
              100% {
                opacity: 1;
                filter: blur(0);
                letter-spacing: 6px;
                transform: translateY(0) scale(1);
              }
            }

            @keyframes humayroSubtitleReveal {
              0% {
                opacity: 0;
                transform: translateY(10px);
                filter: blur(4px);
              }
              100% {
                opacity: 1;
                transform: translateY(0);
                filter: blur(0);
              }
            }

            @keyframes humayroLogoSettle {
              0%,
              100% {
                transform: translateY(0) scale(1);
              }
              50% {
                transform: translateY(-3px) scale(1.006);
              }
            }

            @keyframes humayroBottomGlow {
              0%,
              100% {
                opacity: 0.15;
                transform: translateX(-50%) scaleX(0.7);
              }
              50% {
                opacity: 0.82;
                transform: translateX(-50%) scaleX(1.08);
              }
            }

            @keyframes humayroBottomLine {
              0%,
              100% {
                opacity: 0.22;
                width: 62px;
                transform: translateX(-50%) scaleX(0.68);
              }
              50% {
                opacity: 0.92;
                width: 216px;
                transform: translateX(-50%) scaleX(1);
              }
            }

            @keyframes humayroFlyingLeaf {
              0% {
                opacity: 0;
                transform: translate3d(0, 25px, 0) rotate(var(--leaf-rotation))
                  scale(0.44);
              }
              14% {
                opacity: var(--leaf-opacity);
              }
              56% {
                opacity: var(--leaf-opacity);
                transform: translate3d(
                    calc(var(--leaf-x) * 0.55),
                    calc(var(--leaf-y) * 0.55),
                    0
                  )
                  rotate(calc(var(--leaf-rotation) + 145deg)) scale(1);
              }
              100% {
                opacity: 0;
                transform: translate3d(var(--leaf-x), var(--leaf-y), 0)
                  rotate(calc(var(--leaf-rotation) + 315deg)) scale(0.58);
              }
            }

            @keyframes humayroLoadingDot {
              0%,
              60%,
              100% {
                opacity: 0.25;
                transform: translateY(0);
              }
              30% {
                opacity: 0.9;
                transform: translateY(-3px);
              }
            }

            .humayro-energy-ring {
              stroke-dasharray: 900;
              stroke-dashoffset: 900;
              transform-box: fill-box;
              transform-origin: center;
              animation:
                humayroEnergyRingDraw 1.2s ease-out forwards 0.52s,
                humayroEnergyRingRotate 5.2s linear infinite 0.52s,
                humayroEnergyRingFade 0.85s ease forwards 2.42s;
            }

            .humayro-branch {
              opacity: 0;
              transform-box: fill-box;
              transform-origin: right bottom;
              animation: humayroBranchReveal 0.96s
                cubic-bezier(0.22, 1, 0.36, 1) forwards 1.16s;
            }

            .humayro-leaf {
              opacity: 0;
              transform-box: fill-box;
              transform-origin: center;
              animation: humayroLeafGrow 0.5s ease-out forwards;
            }

            .humayro-profile {
              opacity: 0;
              stroke-dasharray: 1100;
              stroke-dashoffset: 1100;
              animation: humayroProfileDraw 1.22s ease-in-out forwards 1.58s;
            }

            .humayro-moon {
              opacity: 0;
              transform-box: fill-box;
              transform-origin: center;
              animation: humayroMoonReveal 1.05s cubic-bezier(0.22, 1, 0.36, 1)
                forwards 2.1s;
            }

            .humayro-star {
              opacity: 0;
              transform-box: fill-box;
              transform-origin: center;
              animation:
                humayroStarReveal 0.62s ease-out forwards 2.72s,
                humayroStarPulse 1.9s ease-in-out infinite 3.42s;
            }

            .humayro-title {
              opacity: 0;
              animation: humayroTitleReveal 0.9s cubic-bezier(0.22, 1, 0.36, 1)
                forwards 3.2s;
            }

            .humayro-loader {
              --humayro-loader-aura: radial-gradient(
                circle,
                rgba(164, 192, 92, 0.18) 0%,
                rgba(107, 152, 61, 0.08) 37%,
                transparent 72%
              );
              --humayro-loader-core: radial-gradient(
                circle,
                rgba(91, 135, 49, 0.62) 0%,
                rgba(150, 187, 75, 0.25) 30%,
                transparent 72%
              );
              --humayro-loader-glow: radial-gradient(
                ellipse,
                rgba(119, 161, 61, 0.32) 0%,
                rgba(153, 188, 92, 0.11) 45%,
                transparent 76%
              );
              --humayro-loader-title-shadow:
                0 0 8px rgba(72, 112, 43, 0.18),
                0 0 22px rgba(142, 175, 76, 0.14);
              --humayro-core-particle: #5e9639;
              --humayro-core-particle-shadow: 0 0 6px rgba(73, 127, 43, 0.95),
                0 0 15px rgba(111, 159, 57, 0.65);
              --humayro-orbit-particle: #6c9f3f;
              --humayro-orbit-particle-shadow: 0 0 5px rgba(84, 139, 45, 0.92),
                0 0 12px rgba(127, 174, 67, 0.56);
              background: radial-gradient(
                circle at 50% 42%,
                #f2f7e9 0%,
                #fbfdf7 33%,
                #ffffff 72%
              );
            }

            .dark .humayro-loader {
              --humayro-loader-aura: radial-gradient(
                circle,
                rgba(191, 220, 104, 0.09) 0%,
                rgba(99, 154, 56, 0.04) 37%,
                transparent 72%
              );
              --humayro-loader-core: radial-gradient(
                circle,
                rgba(245, 244, 170, 0.95) 0%,
                rgba(161, 193, 77, 0.31) 30%,
                transparent 72%
              );
              --humayro-loader-glow: radial-gradient(
                ellipse,
                rgba(161, 201, 73, 0.36) 0%,
                rgba(94, 140, 46, 0.12) 45%,
                transparent 76%
              );
              --humayro-loader-title-shadow:
                0 0 8px rgba(226, 232, 156, 0.34),
                0 0 22px rgba(107, 148, 57, 0.22);
              --humayro-core-particle: #dce97f;
              --humayro-core-particle-shadow: 0 0 5px rgba(220, 233, 127, 0.95),
                0 0 12px rgba(121, 165, 57, 0.52);
              --humayro-orbit-particle: #b9d664;
              --humayro-orbit-particle-shadow: 0 0 5px rgba(185, 214, 100, 0.8);
              background: radial-gradient(
                circle at 50% 42%,
                #0b2f26 0%,
                #06251e 30%,
                #031b16 61%,
                #01120f 100%
              );
            }

            .humayro-subtitle {
              opacity: 0;
              animation: humayroSubtitleReveal 0.65s ease forwards 3.72s;
            }

            .humayro-logo-wrap {
              animation: humayroLogoSettle 4s ease-in-out infinite 4.4s;
            }

            @keyframes humayroSourceBranchReveal {
              0% {
                opacity: 0;
                filter: blur(8px);
                transform: translate(-18px, 18px) scale(0.72) rotate(-6deg);
              }
              76% {
                opacity: 1;
                filter: blur(0);
                transform: translate(1px, -1px) scale(1.035) rotate(1deg);
              }
              100% {
                opacity: 1;
                filter: blur(0);
                transform: translate(0) scale(1) rotate(0);
              }
            }

            @keyframes humayroSourceProfileReveal {
              0% {
                opacity: 0;
                filter: blur(7px);
                transform: translateY(11px) scale(0.9);
              }
              72% {
                opacity: 1;
                filter: blur(0);
                transform: translateY(-1px) scale(1.02);
              }
              100% {
                opacity: 1;
                filter: blur(0);
                transform: translateY(0) scale(1);
              }
            }

            @keyframes humayroSourceMoonReveal {
              0% {
                opacity: 0;
                filter: blur(12px);
                transform: scale(0.58) rotate(-17deg);
              }
              78% {
                opacity: 1;
                filter: blur(0);
                transform: scale(1.04) rotate(1deg);
              }
              100% {
                opacity: 1;
                filter: blur(0);
                transform: scale(1) rotate(0);
              }
            }

            @keyframes humayroSourceStarReveal {
              0% {
                opacity: 0;
                filter: blur(5px);
                transform: scale(0) rotate(-45deg);
              }
              74% {
                opacity: 1;
                filter: blur(0);
                transform: scale(1.22) rotate(7deg);
              }
              100% {
                opacity: 1;
                filter: blur(0);
                transform: scale(1) rotate(0);
              }
            }

            @keyframes humayroSourceStarPulse {
              0%,
              100% {
                filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.5));
                transform: scale(0.94);
              }
              50% {
                filter: drop-shadow(0 0 9px rgba(255, 255, 255, 0.95));
                transform: scale(1.1);
              }
            }

            .humayro-source-layer {
              pointer-events: none;
              image-rendering: auto;
              transform-box: fill-box;
              transform-origin: center;
            }

            .humayro-source-branch {
              opacity: 0;
              animation: humayroSourceBranchReveal 0.95s
                cubic-bezier(0.22, 1, 0.36, 1) forwards 1.06s;
            }

            .humayro-source-profile {
              opacity: 0;
              animation: humayroSourceProfileReveal 0.96s
                cubic-bezier(0.22, 1, 0.36, 1) forwards 1.62s;
            }

            .humayro-source-moon {
              opacity: 0;
              animation: humayroSourceMoonReveal 1.1s
                cubic-bezier(0.22, 1, 0.36, 1) forwards 2.18s;
            }

            .humayro-source-star {
              opacity: 0;
              animation:
                humayroSourceStarReveal 0.58s ease-out forwards 2.82s,
                humayroSourceStarPulse 1.8s ease-in-out infinite 3.48s;
            }

            .humayro-bottom-glow {
              animation: humayroBottomGlow 1.9s ease-in-out infinite 4s;
            }

            .humayro-bottom-line {
              animation: humayroBottomLine 1.9s ease-in-out infinite 4s;
            }

            .humayro-flying-leaf {
              animation-name: humayroFlyingLeaf;
              animation-timing-function: linear;
              animation-iteration-count: infinite;
            }

            .humayro-loading-dot {
              animation: humayroLoadingDot 1.1s ease-in-out infinite;
            }

            @media (max-width: 640px) {
              .humayro-title {
                letter-spacing: 3px !important;
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .humayro-loader *,
              .humayro-loader *::before,
              .humayro-loader *::after {
                animation-duration: 0.01ms !important;
                animation-delay: 0ms !important;
                animation-iteration-count: 1 !important;
              }
            }
          `}</style>

          <div className="humayro-loader relative flex h-full w-full items-center justify-center overflow-hidden">
            <div
              className="pointer-events-none absolute top-[42%] left-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background: "var(--humayro-loader-aura)",
                animation: "humayroBackgroundBreath 3.8s ease-in-out infinite",
              }}
            />

            <span
              className="pointer-events-none absolute top-[40%] left-1/2 h-16 w-16 rounded-full"
              style={{
                background: "var(--humayro-loader-core)",
                filter: "blur(6px)",
                animation: "humayroCoreFlash 1.48s ease-out forwards",
              }}
            />

            <div className="pointer-events-none absolute top-[40%] left-1/2">
              {stableCoreParticles.map((particle, index) => {
                const style = {
                  width: particle.size,
                  height: particle.size,
                  opacity: particle.opacity,
                  animationDelay: `${particle.delay}s`,
                  animationDuration: `${particle.duration}s`,
                  "--particle-x": `${particle.x}px`,
                  "--particle-y": `${particle.y}px`,
                } as CSSProperties

                return (
                  <span
                    key={index}
                    className="absolute top-0 left-0 rounded-full"
                    style={{
                      ...style,
                      background: "var(--humayro-core-particle)",
                      boxShadow: "var(--humayro-core-particle-shadow)",
                      animationName: "humayroParticleBurst",
                      animationTimingFunction: "ease-out",
                      animationFillMode: "forwards",
                    }}
                  />
                )
              })}
            </div>

            <div className="pointer-events-none absolute top-[40%] left-1/2">
              {stableOrbitParticles.map((particle, index) => {
                const style = {
                  width: particle.size,
                  height: particle.size,
                  animationDelay: `${particle.delay}s`,
                  "--orbit-angle": `${particle.angle}deg`,
                  "--orbit-radius": `${particle.radius}px`,
                } as CSSProperties

                return (
                  <span
                    key={index}
                    className="absolute top-0 left-0 rounded-full"
                    style={{
                      ...style,
                      opacity: 0,
                      background: "var(--humayro-orbit-particle)",
                      boxShadow: "var(--humayro-orbit-particle-shadow)",
                      animation:
                        "humayroOrbitParticle 2.55s ease-in-out forwards",
                    }}
                  />
                )
              })}
            </div>

            {flyingLeaves.map((leaf, index) => {
              const style = {
                left: leaf.left,
                top: leaf.top,
                width: leaf.width,
                height: leaf.width * 0.42,
                animationDelay: `${leaf.delay}s`,
                animationDuration: `${leaf.duration}s`,
                "--leaf-x": `${leaf.moveX}px`,
                "--leaf-y": `${leaf.moveY}px`,
                "--leaf-rotation": `${leaf.rotate}deg`,
                "--leaf-opacity": leaf.opacity,
              } as CSSProperties

              return (
                <span
                  key={index}
                  className="humayro-flying-leaf pointer-events-none absolute rounded-[100%_0_100%_0] opacity-0"
                  style={{
                    ...style,
                    background:
                      "linear-gradient(135deg, #d5df80 0%, #7ca449 55%, #31552f 100%)",
                    boxShadow: "0 0 10px rgba(134,171,66,.2)",
                    filter: "blur(.35px)",
                  }}
                />
              )
            })}

            <div className="humayro-logo-wrap relative z-10 flex w-full max-w-[680px] flex-col items-center px-4 text-center">
              <HumayroLoaderLayers />

              <h1
                className="humayro-title mt-1 bg-linear-to-r from-[#285b37] via-[#4f8a45] to-[#91ae55] bg-clip-text text-[clamp(42px,9vw,72px)] leading-none font-semibold tracking-[0.12em] text-transparent dark:text-white "
                style={{
                  textShadow: "var(--humayro-loader-title-shadow)",
                }}
              >
                HUMAYRO
              </h1>

              {/* <p
                className="humayro-subtitle mt-3 text-[clamp(11px,2.2vw,14px)] font-normal"
                style={{
                  color: "rgba(235,235,199,.82)",
                  letterSpacing: ".2px",
                  textShadow: "0 0 6px rgba(199,212,124,.13)",
                }}
              >
                Ayollar uchun islomiy liboslar
              </p> */}

              <div className="relative mt-5 h-7 w-[min(74vw,290px)]">
                <span
                  className="humayro-bottom-glow absolute top-1/2 left-1/2 h-4 w-[176px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    background: "var(--humayro-loader-glow)",
                    filter: "blur(7px)",
                  }}
                />

                {/* <span
                  className="humayro-bottom-line absolute left-1/2 top-1/2 h-[1.4px] -translate-y-1/2 rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, #7ba042 28%, #dce47d 50%, #7ba042 72%, transparent 100%)",
                    boxShadow:
                      "0 0 5px rgba(171,205,83,.62), 0 0 13px rgba(84,133,43,.34)",
                  }}
                /> */}
              </div>

              {/* {showLoadingText && (
                <div className="mt-2 flex items-center gap-2 text-[clamp(10px,2vw,12px)] tracking-[.5px] text-[#e2e7dc]/50">
                  <span>Sayt yuklanmoqda</span>
                  <span className="flex items-center gap-[5px]">
                    <i className="humayro-loading-dot h-1 w-1 rounded-full bg-[#90b34c]" />
                    <i className="humayro-loading-dot h-1 w-1 rounded-full bg-[#90b34c] [animation-delay:.18s]" />
                    <i className="humayro-loading-dot h-1 w-1 rounded-full bg-[#90b34c] [animation-delay:.36s]" />
                  </span>
                </div>
              )} */}
            </div>
          </div>
        </div>
      )}

      {children}
    </>
  )
}
