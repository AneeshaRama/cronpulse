"use client";

import { useEffect, useState } from "react";

export function AnimateIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-all duration-700 ease-out ${
        visible
          ? "opacity-100 translate-y-0 blur-0"
          : "opacity-0 translate-y-5 blur-[2px]"
      } ${className}`}
    >
      {children}
    </div>
  );
}
