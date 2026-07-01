import { useEffect, useState } from "react";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: string;
  color: string;
}

export function CosmicBackground() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    // Generate star coordinates
    const starColors = ["#f3f4f6", "#06b6d4", "#a78bfa", "#f59e0b", "#60a5fa"];
    const generated: Star[] = [];
    
    for (let i = 0; i < 90; i++) {
      generated.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.7 + 0.3,
        speed: `${(Math.random() * 3 + 2).toFixed(1)}s`,
        color: starColors[Math.floor(Math.random() * starColors.length)]
      });
    }
    setStars(generated);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Dark sky gradient */}
      <div className="absolute inset-0 bg-[#05060a]" />
      
      {/* Nebula ambient lights */}
      <div className="absolute top-1/4 left-1/4 w-[45rem] h-[45rem] rounded-full bg-cosmic-purple/5 blur-[120px] mix-blend-screen" />
      <div className="absolute bottom-1/3 right-10 w-[55rem] h-[55rem] rounded-full bg-neon-cyan/5 blur-[150px] mix-blend-screen" />
      
      {/* Stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full twinkle-star"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: star.color,
            boxShadow: star.size > 1.8 ? `0 0 6px ${star.color}` : "none",
            "--speed": star.speed,
            opacity: star.opacity,
          } as any}
        />
      ))}
    </div>
  );
}
