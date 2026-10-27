import React, { useState, useRef } from 'react';

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  maxTilt?: number;
}

export const Card3D: React.FC<Card3DProps> = ({
  children,
  className = '',
  glowColor = 'rgba(255, 106, 0, 0.25)',
  maxTilt = 8,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = ((y - centerY) / centerY) * -maxTilt;
    const tiltY = ((x - centerX) / centerX) * maxTilt;

    setRotateX(tiltX);
    setRotateY(tiltY);

    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.35,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
      className={`relative transition-transform duration-200 ease-out ${className}`}
    >
      <div
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) ${
            isHovered ? 'scale3d(1.025, 1.025, 1.025) translateZ(10px)' : 'scale3d(1, 1, 1)'
          }`,
          boxShadow: isHovered
            ? `0 20px 40px -15px ${glowColor}, 0 0 25px -5px ${glowColor}`
            : '0 10px 25px -10px rgba(0, 0, 0, 0.5)',
          transformStyle: 'preserve-3d',
        }}
        className="relative w-full h-full rounded-2xl transition-all duration-300 ease-out overflow-hidden"
      >
        {/* Dynamic Specular Glare Effect */}
        <div
          style={{
            background: `radial-gradient(circle 350px at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.15), transparent 70%)`,
            opacity: glarePos.opacity,
          }}
          className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
        />

        {/* Inner Content with 3D Depth */}
        <div style={{ transform: 'translateZ(15px)' }} className="relative z-10 w-full h-full flex flex-col justify-between">
          {children}
        </div>
      </div>
    </div>
  );
};
