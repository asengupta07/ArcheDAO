import React from "react";

interface GradientBackgroundProps {
  className?: string;
}

export function GradientBackground({
  className = "",
}: GradientBackgroundProps) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden bg-black ${className}`}
      style={{
        background:
          "radial-gradient(circle at 20% 20%, rgba(255, 50, 50, 0.15) 0%, transparent 40%), " +
          "radial-gradient(circle at 80% 80%, rgba(255, 70, 70, 0.1) 0%, transparent 40%), " +
          "radial-gradient(circle at 50% 50%, rgba(255, 60, 60, 0.05) 0%, transparent 60%), " +
          "black",
      }}
    >
      <div className="absolute inset-0 backdrop-blur-[100px]" />
    </div>
  );
}
