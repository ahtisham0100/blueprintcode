/* =====================================================================
   Blueprint sheet-curl engine (framework-agnostic).

   Ported from the viewer-curl prototype. A WebGL "drawing sheet" is
   painted in 2D, uploaded as a texture, and curled like a turning page
   to cover / reveal whatever sits underneath (a live iframe or video,
   neither of which can be rasterised into a canvas).

   createCurl(host) attaches its own <canvas> to `host` (a full-size,
   absolutely-positioned element) and returns an imperative controller.
   Returns null when WebGL is unavailable so callers can fall back to a
   plain flat cover.
   ===================================================================== */

export interface CurlEngine {
  /** Paint the cover sheet for the given reference + title. */
  cover(ref: string, title: string): void;
  /** Animate a page turn. dir > 0 curls the sheet away (reveal),
   *  dir < 0 un-curls it back on (cover). Calls done() when finished. */
  turn(ms: number, dir: number, done?: () => void): void;
  /** Hide the sheet immediately. */
  clear(): void;
  /** Tear down GL resources and remove the canvas. */
  destroy(): void;
}

/* ---------- shaders (verbatim from the roll) ---------- */
const PAGE_VS = [
  'attribute vec2 aUv;', 'uniform float uProgress;', 'uniform vec2 uSize;', 'uniform float uThickness;',
  'varying vec2 vUv;', 'varying float vAng;', 'const float PI=3.14159265;', 'void main(){',
  ' vUv=aUv; float x=aUv.x; float y=aUv.y-0.5; float p=clamp(uProgress,0.0,1.10);',
  ' float tilt=0.30*sin(p*PI)*(1.0-p);',
  ' vec2 fn=vec2(cos(tilt),sin(tilt)); vec2 ft=vec2(-sin(tilt),cos(tilt));',
  ' float maxU=cos(tilt)+0.5*abs(sin(tilt)); float foldU=mix(maxU+0.04,-0.16,p);',
  ' vec2 P=vec2(x,y); float u=dot(P,fn); float v=dot(P,ft);',
  ' float base=mix(0.32,0.095,p); float d=u-foldU; float r=base*(1.0+0.55*clamp(d,0.0,1.3));',
  ' float ang=0.0; float uu=u; float z=0.0;',
  ' if(d>0.0){ ang=d/r; uu=foldU+r*sin(ang); z=r*(1.0-cos(ang)); }',
  ' vec2 Q=fn*uu+ft*v; vec3 pos=vec3(Q.x,Q.y+0.5,z); vAng=ang;',
  ' pos.z+=0.03*(1.0-4.0*y*y)*sin(p*PI);',
  ' vec3 w=vec3((pos.x-0.5)*uSize.x,(pos.y-0.5)*uSize.y,pos.z*uSize.x);',
  ' if(uThickness>0.0){ w-=vec3(-sin(ang),0.0,cos(ang))*uThickness; }',
  ' gl_Position=vec4(w.x/(uSize.x*0.5),w.y/(uSize.y*0.5),-w.z/(uSize.x*1.5),1.0);', '}',
].join('\n');

const PAGE_FS = [
  '#ifdef GL_FRAGMENT_PRECISION_HIGH', 'precision highp float;', '#else', 'precision mediump float;', '#endif',
  'uniform sampler2D uMap;', 'uniform float uProgress;', 'uniform float uBackOnly;', 'uniform vec3 uPaper;',
  'varying vec2 vUv;', 'varying float vAng;', 'const float PI=3.14159265;',
  'float inner(float s){ if(s<0.05) return 1.0; if(s<0.15) return mix(1.0,0.06,(s-0.05)/0.10);',
  ' if(s<0.35) return mix(0.06,1.0,(s-0.15)/0.20); return mix(1.0,0.0,clamp((s-0.35)/0.65,0.0,1.0)); }',
  'void main(){ vec3 col;',
  ' if(uBackOnly>0.5 || !gl_FrontFacing){ vec2 gr=fract(vUv*vec2(20.0,11.0));',
  '   float grid=(step(0.965,gr.x)+step(0.965,gr.y))*0.045; col=uPaper+grid; }',
  ' else { col=texture2D(uMap,vUv).rgb; }',
  ' float lambert=0.40+0.60*abs(cos(vAng)); float hi=pow(max(sin(vAng),0.0),9.0)*0.30;',
  ' col=col*lambert*(1.0-0.30*inner(vAng/PI)*step(0.0001,vAng))+hi;',
  ' float a=1.0-smoothstep(0.86,1.00,uProgress);',
  ' gl_FragColor=vec4(col*a,a); }',
].join('\n');

const SHADOW_VS = ['attribute vec2 aUv;', 'varying vec2 vUv;', 'void main(){ vUv=aUv;',
  ' gl_Position=vec4(aUv.x*2.0-1.0,aUv.y*2.0-1.0,0.999,1.0); }'].join('\n');

const SHADOW_FS = ['precision mediump float;', 'uniform float uProgress;', 'varying vec2 vUv;',
  'const float PI=3.14159265;', 'void main(){ float p=clamp(uProgress,0.0,1.0);',
  ' float tilt=0.30*sin(p*PI)*(1.0-p); float maxU=cos(tilt)+0.5*abs(sin(tilt));',
  ' float foldU=mix(maxU+0.04,-0.16,p);',
  ' float u=dot(vec2(vUv.x,vUv.y-0.5),vec2(cos(tilt),sin(tilt))); float d=u-foldU;',
  ' float spread=mix(9.0,3.0,sin(p*PI));',
  ' float a=exp(-max(d,0.0)*spread)*step(0.0,d)*0.55*sin(p*PI);',
  ' a*=0.72+0.28*(1.0-abs(vUv.y-0.5)*2.0); gl_FragColor=vec4(0.0,0.0,0.0,a); }'].join('\n');

function compile(gl: WebGLRenderingContext, t: number, src: string) {
  const s = gl.createShader(t)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
}

function link(gl: WebGLRenderingContext, v: string, f: string) {
  const a = compile(gl, gl.VERTEX_SHADER, v);
  const b = compile(gl, gl.FRAGMENT_SHADER, f);
  if (!a || !b) return null;
  const p = gl.createProgram()!;
  gl.attachShader(p, a);
  gl.attachShader(p, b);
  gl.bindAttribLocation(p, 0, 'aUv');
  gl.linkProgram(p);
  gl.deleteShader(a);
  gl.deleteShader(b);
  return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
}

/* The cover sheet, painted in 2D: ground, grid, corner marks, ref and title. */
function paintCover(W: number, H: number, dpr: number, ref: string, title: string) {
  const c = document.createElement('canvas');
  c.width = Math.round(W * dpr);
  c.height = Math.round(H * dpr);
  const x = c.getContext('2d')!;
  x.scale(dpr, dpr);
  x.fillStyle = '#0B1A2E';
  x.fillRect(0, 0, W, H);
  x.strokeStyle = '#1D3552';
  x.lineWidth = 1;
  for (let g = 96; g < W; g += 96) { x.beginPath(); x.moveTo(g + 0.5, 0); x.lineTo(g + 0.5, H); x.stroke(); }
  for (let h = 96; h < H; h += 96) { x.beginPath(); x.moveTo(0, h + 0.5); x.lineTo(W, h + 0.5); x.stroke(); }
  x.strokeStyle = '#2C4A6E';
  x.strokeRect(18.5, 18.5, W - 37, H - 37);
  x.strokeStyle = '#EAF1F8';
  x.lineWidth = 1.5;
  const m = 26, L = 28;
  ([[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]] as const).forEach((p) => {
    x.beginPath();
    x.moveTo(p[0] + p[2] * L, p[1]);
    x.lineTo(p[0], p[1]);
    x.lineTo(p[0], p[1] + p[3] * L);
    x.stroke();
  });
  x.textAlign = 'center';
  x.fillStyle = '#5F7C9E';
  x.font = '500 13px "DM Mono",monospace';
  x.fillText(ref.toUpperCase(), W / 2, H / 2 - 34);
  x.fillStyle = '#EAF1F8';
  x.font = '46px "Bebas Neue",Impact,sans-serif';
  x.fillText(title.toUpperCase(), W / 2, H / 2 + 16);
  x.fillStyle = '#5F7C9E';
  x.font = '11px "DM Mono",monospace';
  x.fillText('BLUEPRINT CODE — TURN TO VIEW', W / 2, H - 46);
  return c;
}

function ease(t: number) {
  let e = 1 - Math.pow(1 - t, 2.6);
  if (t > 0.82) { const s = (t - 0.82) / 0.18; e += 0.016 * Math.sin(s * Math.PI) * (1 - s); }
  return Math.min(e, 1.02);
}

export function createCurl(host: HTMLElement): CurlEngine | null {
  const canvas = document.createElement('canvas');
  canvas.className = 'dv-curl-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  let gl: WebGLRenderingContext | null = null;
  try {
    gl = (canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true, depth: true })
      || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
  } catch { return null; }
  if (!gl) return null;

  const pageP = link(gl, PAGE_VS, PAGE_FS);
  const shadP = link(gl, SHADOW_VS, SHADOW_FS);
  if (!pageP || !shadP) return null;
  host.appendChild(canvas);

  const NX = 88, NY = 44;
  const uv = new Float32Array((NX + 1) * (NY + 1) * 2);
  let k = 0;
  for (let iy = 0; iy <= NY; iy++) for (let ix = 0; ix <= NX; ix++) { uv[k++] = ix / NX; uv[k++] = iy / NY; }
  const idx = new Uint16Array(NX * NY * 6);
  let q = 0;
  for (let iy = 0; iy < NY; iy++) for (let ix = 0; ix < NX; ix++) {
    const a = iy * (NX + 1) + ix, b = a + 1, c2 = a + NX + 1, d = c2 + 1;
    idx[q++] = a; idx[q++] = c2; idx[q++] = b; idx[q++] = b; idx[q++] = c2; idx[q++] = d;
  }
  const uvB = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvB);
  gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
  const iB = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iB);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);

  const U = {
    progress: gl.getUniformLocation(pageP, 'uProgress'),
    size: gl.getUniformLocation(pageP, 'uSize'),
    thick: gl.getUniformLocation(pageP, 'uThickness'),
    backOnly: gl.getUniformLocation(pageP, 'uBackOnly'),
    paper: gl.getUniformLocation(pageP, 'uPaper'),
    map: gl.getUniformLocation(pageP, 'uMap'),
    shadowP: gl.getUniformLocation(shadP, 'uProgress'),
  };
  let W = 0, H = 0, dpr = 1, tex: WebGLTexture | null = null;

  function measure() {
    const r = host.getBoundingClientRect();
    W = Math.max(2, Math.round(r.width));
    H = Math.max(2, Math.round(r.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    gl!.viewport(0, 0, canvas.width, canvas.height);
  }

  function setCover(ref: string, title: string) {
    measure();
    if (tex) gl!.deleteTexture(tex);
    tex = gl!.createTexture();
    gl!.bindTexture(gl!.TEXTURE_2D, tex);
    gl!.pixelStorei(gl!.UNPACK_FLIP_Y_WEBGL, true);
    gl!.pixelStorei(gl!.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, paintCover(W, H, dpr, ref, title));
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
  }

  function draw(p: number) {
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT | gl!.DEPTH_BUFFER_BIT);
    gl!.enable(gl!.BLEND);
    gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA);
    gl!.bindBuffer(gl!.ARRAY_BUFFER, uvB);
    gl!.enableVertexAttribArray(0);
    gl!.vertexAttribPointer(0, 2, gl!.FLOAT, false, 0, 0);
    gl!.bindBuffer(gl!.ELEMENT_ARRAY_BUFFER, iB);
    gl!.disable(gl!.DEPTH_TEST);
    gl!.depthMask(false);
    gl!.useProgram(shadP);
    gl!.uniform1f(U.shadowP, p);
    gl!.drawElements(gl!.TRIANGLES, idx.length, gl!.UNSIGNED_SHORT, 0);
    gl!.enable(gl!.DEPTH_TEST);
    gl!.depthFunc(gl!.LEQUAL);
    gl!.depthMask(true);
    gl!.useProgram(pageP);
    gl!.uniform1f(U.progress, p);
    gl!.uniform2f(U.size, W, H);
    gl!.uniform3f(U.paper, 0.051, 0.110, 0.188);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE_2D, tex);
    gl!.uniform1i(U.map, 0);
    gl!.uniform1f(U.thick, 3.5);
    gl!.uniform1f(U.backOnly, 1);
    gl!.drawElements(gl!.TRIANGLES, idx.length, gl!.UNSIGNED_SHORT, 0);
    gl!.uniform1f(U.thick, 0);
    gl!.uniform1f(U.backOnly, 0);
    gl!.drawElements(gl!.TRIANGLES, idx.length, gl!.UNSIGNED_SHORT, 0);
  }

  return {
    cover(ref, title) { setCover(ref, title); },
    turn(ms, dir, done) {
      const fwd = dir > 0;
      let t0 = 0;
      draw(fwd ? 0 : 1);
      canvas.classList.add('is-on');
      (function frame(now: number) {
        if (!t0) t0 = now;
        const t = Math.min(1, (now - t0) / ms), e = ease(t);
        draw(fwd ? e : 1 - e);
        if (t < 1) requestAnimationFrame(frame);
        else { if (fwd) canvas.classList.remove('is-on'); done && done(); }
      })(0);
    },
    clear() { canvas.classList.remove('is-on'); },
    destroy() {
      try { if (tex) gl!.deleteTexture(tex); } catch { /* noop */ }
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    },
  };
}
