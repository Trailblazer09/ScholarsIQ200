"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * Decorative, mouse-driven parallax background. Several blurred gradient orbs
 * sit behind the app and drift at different depths as the cursor moves, giving
 * the page a subtle sense of 3D. Purely cosmetic and pointer-events-none.
 */
export function ParallaxBackground() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 45, damping: 18, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 45, damping: 18, mass: 0.6 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mx.set((e.clientX / window.innerWidth - 0.5) * 2); // -1 .. 1
      my.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    const onOrient = (e: DeviceOrientationEvent) => {
      // Light parallax on mobile via device tilt.
      if (e.gamma != null && e.beta != null) {
        mx.set(Math.max(-1, Math.min(1, e.gamma / 45)));
        my.set(Math.max(-1, Math.min(1, e.beta / 45)));
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("deviceorientation", onOrient);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("deviceorientation", onOrient);
    };
  }, [mx, my]);

  // Each orb moves a different amount (and some inversely) for a depth effect.
  const aX = useTransform(sx, (v) => v * 45);
  const aY = useTransform(sy, (v) => v * 45);
  const bX = useTransform(sx, (v) => v * -70);
  const bY = useTransform(sy, (v) => v * -70);
  const cX = useTransform(sx, (v) => v * 30);
  const cY = useTransform(sy, (v) => v * 30);
  const dX = useTransform(sx, (v) => v * -40);
  const dY = useTransform(sy, (v) => v * -40);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden print:hidden">
      {/* Base wash so orbs blend into the page background. */}
      <div className="absolute inset-0 bg-background" />

      <motion.div
        style={{ x: aX, y: aY }}
        className="absolute -top-48 left-[12%] h-[38rem] w-[38rem] rounded-full bg-accent/25 blur-[130px]"
      />
      <motion.div
        style={{ x: bX, y: bY }}
        className="absolute -bottom-56 right-[2%] h-[36rem] w-[36rem] rounded-full bg-accent-2/20 blur-[140px]"
      />
      <motion.div
        style={{ x: cX, y: cY }}
        className="absolute top-[28%] right-[22%] h-[26rem] w-[26rem] rounded-full bg-emerald-500/15 blur-[110px]"
      />
      <motion.div
        style={{ x: dX, y: dY }}
        className="absolute bottom-[18%] left-[6%] h-[22rem] w-[22rem] rounded-full bg-teal-400/10 blur-[100px]"
      />

      {/* Faint grid overlay for a techy, layered feel. */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          color: "var(--foreground)",
        }}
      />
    </div>
  );
}
