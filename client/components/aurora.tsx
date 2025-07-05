import React, { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Color, Triangle } from "ogl";

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ),
      0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {              \\
  int index = 0;                                            \\
  for (int i = 0; i < 2; i++) {                               \\
     ColorStop currentColor = colors[i];                    \\
     bool isInBetween = currentColor.position <= factor;    \\
     index = int(mix(float(index), float(i), float(isInBetween))); \\
  }                                                         \\
  ColorStop currentColor = colors[index];                   \\
  ColorStop nextColor = colors[index + 1];                  \\
  float range = nextColor.position - currentColor.position; \\
  float lerpFactor = (factor - currentColor.position) / range; \\
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \\
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);

  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);

  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;

  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);

  vec3 auroraColor = intensity * rampColor;

  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`;

interface AuroraProps {
  className?: string;
  colorStops?: [string, string, string]; // Enforce 3 color stops
  amplitude?: number;
  blend?: number;
  time?: number;
  speed?: number;
}

const AuroraComponent = (props: AuroraProps) => {
  const {
    className = "w-full h-full",
    colorStops: initialColorStops = ["#3A29FF", "#FF94B4", "#FF3232"],
    amplitude: initialAmplitude = 1.0,
    blend: initialBlend = 0.5,
    speed: initialSpeed = 0.5,
  } = props;

  const propsRef = useRef<AuroraProps>(props);
  propsRef.current = props; // Keep propsRef updated for the animation loop

  const ctnDom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctn = ctnDom.current;
    if (!ctn) return;

    const renderer = new Renderer({
      alpha: false,
      premultipliedAlpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio, 2),
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    let program: Program | undefined;

    function resize() {
      if (!ctn || !program) return;
      const width = ctn.offsetWidth;
      const height = ctn.offsetHeight;
      renderer.setSize(width, height);
      program.uniforms.uResolution.value = [width, height];
    }
    window.addEventListener("resize", resize, false);

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) {
      delete (geometry.attributes as any).uv;
    }
    if (geometry.attributes.normal) {
      delete (geometry.attributes as any).normal;
    }

    const parsedColorStops = (propsRef.current.colorStops || initialColorStops).map((hex) => {
      const c = new Color(hex);
      return [c.r, c.g, c.b];
    });

    program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      transparent: true, // OGL hint
      depthTest: false,  // Not needed for 2D fullscreen effect
      depthWrite: false, // Not needed
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: propsRef.current.amplitude ?? initialAmplitude },
        uColorStops: { value: parsedColorStops },
        uResolution: { value: [ctn.offsetWidth, ctn.offsetHeight] },
        uBlend: { value: propsRef.current.blend ?? initialBlend },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    ctn.appendChild(gl.canvas);
    gl.canvas.style.position = 'absolute'; // Ensure canvas fills the div
    gl.canvas.style.top = '0';
    gl.canvas.style.left = '0';


    let animateId = 0;
    const update = (t: number) => {
      animateId = requestAnimationFrame(update);
      const currentProps = propsRef.current;
      const { time, speed = initialSpeed } = currentProps;

      if (program) {
        program.uniforms.uTime.value = (time ?? t * 0.001) * speed; // Adjusted time for smoother default
        program.uniforms.uAmplitude.value = currentProps.amplitude ?? initialAmplitude;
        program.uniforms.uBlend.value = currentProps.blend ?? initialBlend;

        const stops = currentProps.colorStops ?? initialColorStops;
        if (program.uniforms.uColorStops.value.some((cs: number[], i: number) => {
            const newC = new Color(stops[i]);
            return cs[0] !== newC.r || cs[1] !== newC.g || cs[2] !== newC.b;
        })) {
            program.uniforms.uColorStops.value = stops.map((hex: string) => {
                const c = new Color(hex);
                return [c.r, c.g, c.b];
            });
        }
        renderer.render({ scene: mesh });
      }
    };

    resize(); // Initial size setup
    animateId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animateId);
      window.removeEventListener("resize", resize, false);
      if (ctn && gl.canvas.parentNode === ctn) {
        ctn.removeChild(gl.canvas);
      }
      // Attempt to release WebGL context
      const loseContextExt = gl.getExtension("WEBGL_lose_context");
      if (loseContextExt) {
        loseContextExt.loseContext();
      }
      // OGL renderer might have its own cleanup, check its docs if issues persist
    };
    // Re-run effect if these fundamental props change to reinitialize WebGL
  }, [initialColorStops, initialAmplitude, initialBlend, initialSpeed]);

  return (
    <div 
      ref={ctnDom} 
      className={`relative overflow-hidden bg-black ${className}`}
    />
  );
};

export { AuroraComponent as Aurora };