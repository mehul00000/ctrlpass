"use client";

import React from "react";

interface MusicCardProps {
  title?: string;
  subtitle?: string;
  tracks?: string;
  image?: string;
  className?: string;
}

export const UiloraMusicCard: React.FC<MusicCardProps> = ({
  title = "Frontend Radio",
  subtitle = "DAILY MIX",
  tracks = "12 Tracks",
  image = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop",
  className = "",
}) => {
  return (
    <div className={`w-80 bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-6 shadow-2xl backdrop-blur-sm transition-all duration-300 hover:bg-zinc-900/80 group ${className}`}>
      <div className="flex flex-col gap-1 mb-6">
        <span className="text-zinc-500 text-xs font-bold tracking-[0.2em] uppercase">
          {subtitle}
        </span>
        <span className="text-zinc-400 text-sm font-medium">
          {tracks}
        </span>
        <h2 className="text-white text-3xl font-bold mt-1 tracking-tight group-hover:text-sky-400 transition-colors">
          {title}
        </h2>
      </div>

      <div className="relative w-full aspect-square overflow-hidden rounded-[1.5rem] shadow-inner">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
    </div>
  );
};
