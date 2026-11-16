"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useScroll, useVelocity, useSpring, useTransform, useAnimationFrame } from "framer-motion";

interface VelocityScrollProps {
    texts?: [string, string];
    baseVelocity?: number;
}

const ParallaxText = ({ children, baseVelocity = 3 }: { children: string; baseVelocity: number }) => {
    const baseX = useMotionValue(0);
    const { scrollY } = useScroll();
    const scrollVelocity = useVelocity(scrollY);
    const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
    const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], { clamp: false });
    const x = useTransform(baseX, (v) => `${(v % 100) - 25}%`);
    const directionFactor = useRef<number>(1);

    useAnimationFrame((_, delta) => {
        let moveBy = directionFactor.current * baseVelocity * (delta / 1000);
        if (velocityFactor.get() < 0) directionFactor.current = -1;
        else if (velocityFactor.get() > 0) directionFactor.current = 1;
        moveBy += directionFactor.current * moveBy * velocityFactor.get();
        baseX.set(baseX.get() + moveBy);
    });

    return (
        <div className="overflow-hidden m-0 whitespace-nowrap flex flex-nowrap w-full">
            <motion.div
                className="font-black text-8xl md:text-9xl tracking-tighter uppercase flex whitespace-nowrap"
                style={{ x }}
            >
                {[0, 1, 2, 3].map((k) => (
                    <span key={k} className="block mr-12 text-zinc-300">{children} </span>
                ))}
            </motion.div>
        </div>
    );
};

export const VelocityScroll = ({
    texts = ["Kinetic Motion", "Scroll Velocity"],
    baseVelocity = 3,
}: VelocityScrollProps) => {
    return (
        <div className="w-full h-screen flex flex-col justify-center bg-zinc-950 space-y-8 overflow-hidden">
            <ParallaxText baseVelocity={-baseVelocity}>{texts[0]}</ParallaxText>
            <ParallaxText baseVelocity={baseVelocity}>{texts[1]}</ParallaxText>
        </div>
    );
};
