"use client";

import { useState, useEffect, useRef, RefObject } from "react";

interface NavItem {
  label: string;
  link: string;
}

interface FloatingNavbarProps {
  navItems?: NavItem[];
  className?: string;
}

export default function FloatingNavbar({
  navItems = [
    { label: "Home", link: "#" },
    { label: "Wallet", link: "#wallet" },
    { label: "Features", link: "#features" },
    { label: "About", link: "#about" },
  ],
  className = "",
}: FloatingNavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("#");
  const [activeIndex, setActiveIndex] = useState(0);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const btnRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.6,
      rootMargin: "-20% 0% -20% 0%",
    };
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          if (id === "wallet" || id === "features" || id === "about") {
            const section = `#${id}`;
            setActiveSection(section);
            const index = navItems.findIndex((item) => item.link === section);
            if (index !== -1) setActiveIndex(index);
          } else {
            setActiveSection("#");
            setActiveIndex(0);
          }
        }
      });
    };
    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );
    const sections = document.querySelectorAll(
      '[id="wallet"], [id="features"], [id="about"]'
    );
    sections.forEach((section) => observer.observe(section));
    const checkTop = () => {
      if (window.scrollY < 100) {
        setActiveSection("#");
        setActiveIndex(0);
      }
    };
    window.addEventListener("scroll", checkTop);
    checkTop();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", checkTop);
    };
  }, [navItems]);

  // Update indicator position and size when activeIndex or nav changes
  useEffect(() => {
    const btn = btnRefs.current[activeIndex];
    const container = containerRef.current;
    if (btn && container) {
      const btnRect = btn.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const gap = 32; // gap-8 = 2rem = 32px
      const halfGap = gap / 2;
      const style: { left: number; width: number } = { left: 0, width: 0 };
      if (activeIndex === 0) {
        // Extend to the left edge (include left padding), only extend right
        style.left = 0;
        style.width = btnRect.right - containerRect.left + halfGap;
      } else if (activeIndex === navItems.length - 1) {
        // Extend to the right edge (include right padding), only extend left
        style.left = btnRect.left - containerRect.left - halfGap;
        style.width = containerRect.right - btnRect.left + halfGap;
      } else {
        // Normal case: extend left and right by half the gap
        style.left = btnRect.left - containerRect.left - halfGap;
        style.width = btnRect.width + gap;
      }
      setIndicatorStyle(style);
    }
  }, [activeIndex, navItems]);

  const handleNavigate = (link: string, index: number) => {
    if (!link) return;
    setActiveSection(link);
    setActiveIndex(index);
    if (link.startsWith("#")) {
      const element = document.querySelector(link);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      window.location.href = link;
    }
  };

  return (
    <nav
      className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
        isScrolled ? "top-4" : "top-6"
      } ${className}`}
    >
      <div
        ref={containerRef}
        className={`
          relative flex items-center justify-center gap-8 px-8 py-4 rounded-full
          backdrop-blur-md bg-white/10 border border-white/20
          shadow-lg shadow-black/25
          transition-all duration-300
          ${isScrolled ? "bg-white/5 border-white/10" : ""}
        `}
      >
        {/* Moving Active State Background */}
        <div
          className={`
            absolute top-0 left-0 h-full pointer-events-none
            bg-gradient-to-r from-white/30 via-white/20 to-white/30
            backdrop-blur-lg shadow-inner
            transition-all duration-500 ease-in-out
          `}
          style={{
            width: indicatorStyle.width,
            left: indicatorStyle.left,
            background:
              "linear-gradient(135deg, rgba(255,0,64,0.35) 0%, rgba(255,0,64,0.15) 50%, rgba(255,0,64,0.35) 100%)",
            backdropFilter: "blur(12px)",
            boxShadow:
              "0 0 25px rgba(255, 0, 64, 0.4), inset 0 0 25px rgba(255, 0, 64, 0.2)",
            borderTopLeftRadius:
              activeIndex === 0
                ? "9999px"
                : activeIndex === navItems.length - 1
                ? "2000px"
                : "12px",
            borderBottomLeftRadius:
              activeIndex === 0
                ? "9999px"
                : activeIndex === navItems.length - 1
                ? "2000px"
                : "12px",
            borderTopRightRadius:
              activeIndex === navItems.length - 1
                ? "9999px"
                : activeIndex === 0
                ? "2000px"
                : "12px",
            borderBottomRightRadius:
              activeIndex === navItems.length - 1
                ? "9999px"
                : activeIndex === 0
                ? "2000px"
                : "12px",
            transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
        {navItems.map(({ label, link }, index) => {
          const isActive = activeSection === link;
          return (
            <button
              key={label}
              ref={(el) => {
                btnRefs.current[index] = el;
              }}
              onClick={() => handleNavigate(link, index)}
              className={`
                relative px-6 py-2 rounded-lg text-lg font-medium text-white
                transition-all duration-300
                group
                z-10
                ${isActive ? "" : ""}
              `}
            >
              <span className="relative z-10">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
