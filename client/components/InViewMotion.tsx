import { motion, useAnimation } from "framer-motion";
import { useEffect, useRef, PropsWithChildren } from "react";

interface InViewMotionProps extends PropsWithChildren<any> {
  className?: string;
  [key: string]: any;
}

export default function InViewMotion({
  children,
  className = "",
  ...props
}: InViewMotionProps) {
  const controls = useAnimation();
  const ref = useRef(null);

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          controls.start("visible");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [controls]);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
