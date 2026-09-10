/**
 * Transition quad shaders.
 *
 * One material serves all three transition kinds (selected by `uKind`) plus a
 * procedural "plate" that stands in whenever a texture is missing, so the
 * fallback still reads as designed rather than as a hole in the page.
 *
 * Written in GLSL ES 1.00: three.js injects the version line, precision and the
 * `texture2D` shim for WebGL2. Output is passed through three's
 * `colorspace_fragment` chunk so sRGB textures are mixed in linear light and
 * encoded back on the way out.
 */

export const vertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  // PlaneGeometry(2, 2) already spans clip space; the camera matrices are skipped.
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const fragmentShader = /* glsl */ `
#define PI 3.14159265359

uniform sampler2D uFrom;
uniform sampler2D uTo;
uniform sampler2D uDisp;

uniform vec2 uRes;        // viewport, css px
uniform vec2 uFromRes;    // texture sizes, px
uniform vec2 uToRes;

uniform float uProgress;  // 0 = pure from, 1 = pure to
uniform float uKind;      // 0 dissolve, 1 ripple, 2 stretch
uniform vec2 uOrigin;     // ripple centre, 0..1, y up
uniform float uIntensity;
uniform float uTime;      // seconds
uniform float uDispScale;
uniform float uHasFrom;   // 0 = plate, 1 = texture, in between = crossfade
uniform float uHasTo;
uniform vec3 uTint;       // forest, linear
uniform vec3 uGold;       // gold, linear

varying vec2 vUv;

// CSS object-fit: cover. Centre the texture and crop the overflowing axis.
vec2 coverUv(vec2 uv, vec2 tex, vec2 view) {
  float ta = tex.x / max(tex.y, 1.0);
  float va = view.x / max(view.y, 1.0);
  vec2 s = ta > va ? vec2(va / ta, 1.0) : vec2(1.0, ta / va);
  return clamp((uv - 0.5) * s + 0.5, 0.0, 1.0);
}

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// Tiled displacement noise; cells stay square regardless of viewport aspect.
vec2 dispAt(vec2 uv, float scale) {
  float aspect = uRes.x / max(uRes.y, 1.0);
  return texture2D(uDisp, uv * vec2(aspect, 1.0) * uDispScale * scale).rg;
}

// Displacement fades to zero at the borders so clamped edges never smear.
float edgeMask(vec2 uv) {
  vec2 lo = smoothstep(0.0, 0.14, uv);
  vec2 hi = 1.0 - smoothstep(0.86, 1.0, uv);
  return lo.x * lo.y * hi.x * hi.y;
}

// Brand plate: forest gradient, vignette, a breath of gold and living grain.
vec3 plate(vec2 uv) {
  float diag = uv.y * 0.72 + uv.x * 0.28;
  vec3 col = mix(uTint * 0.5, uTint * 1.3, smoothstep(0.0, 1.0, diag));
  vec2 q = (uv - 0.5) * vec2(1.25, 1.0);
  col *= mix(0.58, 1.0, 1.0 - smoothstep(0.2, 1.0, length(q)));
  col += uGold * 0.05 * (1.0 - smoothstep(0.0, 0.8, length(uv - vec2(0.3, 0.72))));
  // Grain refreshes at 24 fps so it reads as film rather than static.
  float frame = floor(uTime * 24.0);
  float g = hash21(floor(gl_FragCoord.xy * 0.5) + vec2(frame * 7.13, frame * 3.71));
  col += (g - 0.5) * 0.035;
  return col;
}

vec3 sampleFrom(vec2 uv) {
  vec3 t = texture2D(uFrom, coverUv(uv, uFromRes, uRes)).rgb;
  if (uHasFrom >= 0.999) return t;
  return mix(plate(uv), t, uHasFrom);
}

vec3 sampleTo(vec2 uv) {
  vec3 t = texture2D(uTo, coverUv(uv, uToRes, uRes)).rgb;
  if (uHasTo >= 0.999) return t;
  return mix(plate(uv), t, uHasTo);
}

// 0 — noise-threshold reveal with a thin gold edge; both images drift with the noise.
vec3 dissolve(vec2 zuv, vec2 uv, vec2 d, float p, float em) {
  float n = dispAt(uv, 0.55).r;
  float s = 0.1;
  float t = mix(-s, 1.0 + s, p);
  float keep = smoothstep(t - s, t + s, n);
  float band = 1.0 - smoothstep(0.0, 0.03, abs(n - t));
  band *= smoothstep(0.0, 0.06, p) * (1.0 - smoothstep(0.94, 1.0, p));
  vec2 push = d * uIntensity * em;
  vec3 a = sampleFrom(zuv + push * p);
  vec3 b = sampleTo(zuv - push * (1.0 - p));
  // The edge burns a little before it lets go.
  a *= 1.0 - 0.45 * band;
  vec3 col = mix(b, a, keep);
  col += uGold * band * 0.5;
  return col;
}

// 1 — radial sine wave from uOrigin, decaying with distance and progress, over a crossfade.
vec3 ripple(vec2 zuv, vec2 uv, float p, float em) {
  float aspect = uRes.x / max(uRes.y, 1.0);
  vec2 q = (uv - uOrigin) * vec2(aspect, 1.0);
  float dist = length(q);
  vec2 dir = q / max(dist, 1e-4);
  float env = smoothstep(0.0, 0.12, p) * pow(1.0 - p, 1.4);
  float decay = exp(-dist * 1.4);
  float amp = uIntensity * env * decay;
  float wave = sin(dist * 24.0 - p * 20.0);
  vec2 off = dir * wave * amp * em;
  off.x /= aspect;
  // The incoming image spreads outward from the origin behind the wavefront.
  float reach = p * 2.7 - 0.25;
  float m = max(smoothstep(dist, dist + 0.75, reach), smoothstep(0.7, 1.0, p));
  vec3 a = sampleFrom(zuv + off);
  vec3 b = sampleTo(zuv + off * 0.5);
  vec3 col = mix(a, b, m);
  col += uGold * max(wave, 0.0) * env * decay * 0.09;
  return col;
}

// 2 — the outgoing image is pulled upward like rubber film while the incoming
// one, stretched from the top, compresses into place. Slight chromatic split at the peak.
vec3 stretch(vec2 zuv, vec2 uv, vec2 d, float p, float em) {
  float k = uIntensity;
  float q = 1.0 - p;
  float sA = 1.0 + 1.8 * k * p * p;
  float sB = 1.0 + 1.8 * k * q * q;
  float pinch = 1.0 + 0.05 * k * p * p * em;
  vec2 uvA = vec2(0.5 + (zuv.x - 0.5) * pinch, zuv.y / sA);
  vec2 uvB = vec2(zuv.x, 1.0 - (1.0 - zuv.y) / sB);
  float env = sin(p * PI);
  float ca = 0.012 * k * env;

  vec3 a;
  a.r = sampleFrom(uvA + vec2(0.0, ca)).r;
  a.g = sampleFrom(uvA).g;
  a.b = sampleFrom(uvA - vec2(0.0, ca)).b;
  vec3 b;
  b.r = sampleTo(uvB + vec2(0.0, ca * 0.6)).r;
  b.g = sampleTo(uvB).g;
  b.b = sampleTo(uvB - vec2(0.0, ca * 0.6)).b;

  // Film thins as it stretches.
  a *= 1.0 - 0.2 * smoothstep(1.0, 2.8, sA);
  b *= 1.0 - 0.2 * smoothstep(1.0, 2.8, sB);

  // Tear line travels top to bottom, roughened by the noise field.
  float line = 1.3 - 1.6 * p + d.x * 0.05;
  float m = smoothstep(line - 0.2, line + 0.2, zuv.y);
  vec3 col = mix(a, b, m);
  float tear = (1.0 - smoothstep(0.0, 0.01, abs(zuv.y - line))) * env;
  col += uGold * tear * 0.45;
  return col;
}

void main() {
  vec2 uv = vUv;
  float p = clamp(uProgress, 0.0, 1.0);
  float env = sin(p * PI);
  vec2 d = (dispAt(uv, 1.0) - 0.5) * 2.0;
  float em = edgeMask(uv);

  // Shared breathing zoom: the outgoing image pushes in, the incoming one settles back.
  // Zero at both ends so p = 0 and p = 1 are pixel-exact with the DOM heroes.
  float zoom = 1.0 + 0.06 * env;
  vec2 zuv = (uv - 0.5) / zoom + 0.5;

  vec3 col;
  if (uKind < 0.5) {
    col = dissolve(zuv, uv, d, p, em);
  } else if (uKind < 1.5) {
    col = ripple(zuv, uv, p, em);
  } else {
    col = stretch(zuv, uv, d, p, em);
  }

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;
