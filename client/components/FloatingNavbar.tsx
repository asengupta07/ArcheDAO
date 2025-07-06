"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface NavItem {
  label: string;
  link: string;
}

interface FloatingNavbarProps {
  navItems?: NavItem[];
  className?: string;
  activeTab?: string; // Control which tab is active
  onTabChange?: (tab: string, index: number) => void; // Callback when tab changes
}

export default function FloatingNavbar({
  navItems = [
    { label: "DAOs", link: "/dao/dashboard" },
    { label: "Join", link: "/invite" },
    { label: "Tasks", link: "/dao/tasks" },
    { label: "Proposals", link: "/dao/proposals" },
  ],
  className = "",
  activeTab = "/", // Default to homepage
  onTabChange,
}: FloatingNavbarProps) {
  const router = useRouter();
  // Split nav items into left and right groups
  const leftItems = navItems.slice(0, 2);
  const rightItems = navItems.slice(2, 4);
  const [isScrolled, setIsScrolled] = useState(false);

  // Convert activeTab prop to activeIndex
  const getActiveIndex = (tab: string): number => {
    if (tab === "/") return 2; // ArcheDAO center
    const itemIndex = navItems.findIndex((item) => item.link === tab);
    if (itemIndex === -1) return 2; // Default to center if not found
    // Map navItems index to our 5-element layout: [0,1,center,2,3]
    return itemIndex < 2 ? itemIndex : itemIndex + 1;
  };

  const [activeSection, setActiveSection] = useState(activeTab);
  const [activeIndex, setActiveIndex] = useState(getActiveIndex(activeTab));
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const btnRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const centerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Create a combined refs array: [left items, center, right items]
  const allRefs = [
    ...btnRefs.current.slice(0, 2),
    centerRef.current,
    ...btnRefs.current.slice(2, 4),
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Update internal state when activeTab prop changes
  useEffect(() => {
    setActiveSection(activeTab);
    setActiveIndex(getActiveIndex(activeTab));
  }, [activeTab]);

  // Update indicator position and size when activeIndex or nav changes
  useEffect(() => {
    const container = containerRef.current;
    let targetElement = null;

    // Get the correct element based on active index
    if (activeIndex === 2) {
      targetElement = centerRef.current; // Center element (ArcheDAO)
    } else if (activeIndex < 2) {
      targetElement = btnRefs.current[activeIndex]; // Left side elements
    } else {
      targetElement = btnRefs.current[activeIndex - 1]; // Right side elements (adjust for center)
    }

    if (targetElement && container) {
      const btnRect = targetElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const gap = 32; // gap-8 = 2rem = 32px
      const halfGap = gap / 2;
      const style: { left: number; width: number } = { left: 0, width: 0 };

      if (activeIndex === 0) {
        // First element (leftmost) - extend to the left edge
        style.left = 0;
        style.width = btnRect.right - containerRect.left + halfGap;
      } else if (activeIndex === 4) {
        // Last element (rightmost) - extend to the right edge
        style.left = btnRect.left - containerRect.left - halfGap;
        style.width = containerRect.right - btnRect.left + halfGap;
      } else {
        // Middle elements - normal case
        style.left = btnRect.left - containerRect.left - halfGap;
        style.width = btnRect.width + gap;
      }
      setIndicatorStyle(style);
    }
  }, [activeIndex]);

  const handleNavigate = (link: string, index: number) => {
    if (!link) return;

    // Call onTabChange callback if provided, otherwise update internal state
    if (onTabChange) {
      onTabChange(link, index);
    } else {
      setActiveSection(link);
      setActiveIndex(index);
    }

    // Use Next.js router for navigation
    router.push(link);
  };

  const handleCenterClick = () => {
    // Call onTabChange callback if provided, otherwise update internal state
    if (onTabChange) {
      onTabChange("/", 2);
    } else {
      setActiveSection("/");
      setActiveIndex(2);
    }
    router.push("/");
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
          relative flex items-center justify-between gap-8 px-8 py-4 rounded-full
          backdrop-blur-xl bg-gradient-to-br from-white/20 via-white/5 to-white/20
          shadow-2xl shadow-black/40
          transition-all duration-300
          ${
            isScrolled
              ? "bg-gradient-to-br from-white/15 via-white/3 to-white/15 border-white/20"
              : ""
          }
        `}
        style={{
          background: isScrolled
            ? "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.02) 35%, rgba(255,255,255,0.02) 65%, rgba(255,255,255,0.15) 100%)"
            : "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 35%, rgba(255,255,255,0.05) 65%, rgba(255,255,255,0.25) 100%)",
          backdropFilter: "blur(24px) saturate(180%)",
          borderImage:
            "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.4) 100%) 1",
          boxShadow: `
            0 8px 32px rgba(0,0,0,0.4),
            0 2px 8px rgba(0,0,0,0.2),
            inset 0 1px 0 rgba(255,255,255,0.3),
            inset 0 -1px 0 rgba(255,255,255,0.1),
            0 0 0 1px rgba(255,255,255,0.1)
          `,
        }}
      >
        {/* Moving Active State Background */}
        <div
          className={`
            absolute top-0 left-0 h-full pointer-events-none
            transition-all duration-500 ease-in-out
            ${activeIndex === 2 ? "opacity-0" : "opacity-100"}
          `}
          style={{
            width: indicatorStyle.width,
            left: indicatorStyle.left,
            background: `
              linear-gradient(135deg, 
                rgba(255,0,64,0.4) 0%, 
                rgba(255,0,64,0.1) 25%, 
                rgba(255,0,64,0.05) 50%, 
                rgba(255,0,64,0.1) 75%, 
                rgba(255,0,64,0.4) 100%
              )
            `,
            backdropFilter: "blur(16px) saturate(150%)",
            boxShadow: `
              0 0 30px rgba(255, 0, 64, 0.5),
              0 0 60px rgba(255, 0, 64, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.4),
              inset 0 -1px 0 rgba(255, 0, 64, 0.3),
              inset 0 0 20px rgba(255, 0, 64, 0.1),
              0 2px 8px rgba(255, 0, 64, 0.3)
            `,
            border: "1px solid rgba(255, 0, 64, 0.3)",
            borderTopLeftRadius:
              activeIndex === 0
                ? "9999px"
                : activeIndex === 4
                ? "2000px"
                : "12px",
            borderBottomLeftRadius:
              activeIndex === 0
                ? "9999px"
                : activeIndex === 4
                ? "2000px"
                : "12px",
            borderTopRightRadius:
              activeIndex === 4
                ? "9999px"
                : activeIndex === 0
                ? "2000px"
                : "12px",
            borderBottomRightRadius:
              activeIndex === 4
                ? "9999px"
                : activeIndex === 0
                ? "2000px"
                : "12px",
            transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
        {/* Left Nav Items */}
        <div className="flex items-center gap-6">
          {leftItems.map(({ label, link }, index) => {
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
                  ${isActive ? "text-white" : "text-white/80 hover:text-white"}
                `}
              >
                <span className="relative z-10">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Center Company Name */}
        <button
          ref={centerRef}
          onClick={handleCenterClick}
          className={`
            relative px-8 py-3 rounded-lg text-2xl font-black text-white
            transition-all duration-300
            group
            z-10
            ${
              activeSection === "/"
                ? "text-white"
                : "text-white/90 hover:text-white"
            }
          `}
          style={{
            fontFamily: "Jost, ui-sans-serif, system-ui, sans-serif",
            textShadow:
              activeSection === "/"
                ? "0 0 15px rgba(255, 0, 64, 0.9), 0 0 30px rgba(255, 0, 64, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)"
                : "0 2px 4px rgba(0, 0, 0, 0.4)",
            letterSpacing: "0.05em",
          }}
        >
          <span className="relative z-10 bg-gradient-to-r from-white via-pink-100 to-white bg-clip-text text-transparent">
            ArcheDAO
          </span>
        </button>

        {/* Right Nav Items */}
        <div className="flex items-center gap-6">
          {rightItems.map(({ label, link }, index) => {
            const isActive = activeSection === link;
            const actualIndex = index + 2; // Adjust for left items
            return (
              <button
                key={label}
                ref={(el) => {
                  btnRefs.current[actualIndex] = el;
                }}
                onClick={() => handleNavigate(link, actualIndex + 1)} // +1 for center element
                className={`
                  relative px-6 py-2 rounded-lg text-lg font-medium text-white
                  transition-all duration-300
                  group
                  z-10
                  ${isActive ? "text-white" : "text-white/80 hover:text-white"}
                `}
              >
                <span className="relative z-10">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
