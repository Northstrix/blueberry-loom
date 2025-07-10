'use client';

import React, { useEffect, useRef } from 'react';

// Vertex shader (pass-through)
const vert = `#version 300 es
precision highp float;
in vec2 position;
out vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

// Fragment shader (Tranquiluxe)
const frag = `#version 300 es
precision highp float;

uniform float uTime;
uniform vec3 uColor;
uniform vec3 uResolution;

in vec2 vUv;
out vec4 fragColor;

float colormap_red(float x) {
    if (x < 0.0) {
        return 54.0 / 255.0;
    } else if (x < 20049.0 / 82979.0) {
        return (829.79 * x + 54.51) / 255.0;
    } else {
        return 1.0;
    }
}

float colormap_green(float x) {
    if (x < 20049.0 / 82979.0) {
        return 0.0;
    } else if (x < 327013.0 / 810990.0) {
        return (8546482679670.0 / 10875673217.0 * x - 2064961390770.0 / 10875673217.0) / 255.0;
    } else if (x <= 1.0) {
        return (103806720.0 / 483977.0 * x + 19607415.0 / 483977.0) / 255.0;
    } else {
        return 1.0;
    }
}

float colormap_blue(float x) {
    if (x < 0.0) {
        return 54.0 / 255.0;
    } else if (x < 7249.0 / 82979.0) {
        return (829.79 * x + 54.51) / 255.0;
    } else if (x < 20049.0 / 82979.0) {
        return 127.0 / 255.0;
    } else if (x < 327013.0 / 810990.0) {
        return (792.0224934136139 * x - 64.36479073560233) / 255.0;
    } else {
        return 1.0;
    }
}

vec4 colormap(float x) {
    return vec4(colormap_red(x), colormap_green(x), colormap_blue(x), 1.0);
}

float rand(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p){
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u*u*(3.0-2.0*u);

    float res = mix(
    mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
    mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
    return res*res;
}

const mat2 mtx = mat2( 0.80,  0.60, -0.60,  0.80 );

float fbm( vec2 p )
{
    float f = 0.0;
    float time = uTime * .25;

    f += 0.500000*noise( p + time  ); p = mtx*p*2.02;
    f += 0.031250*noise( p ); p = mtx*p*2.01;
    f += 0.250000*noise( p ); p = mtx*p*2.03;
    f += 0.125000*noise( p ); p = mtx*p*2.01;
    f += 0.062500*noise( p ); p = mtx*p*2.04;
    f += 0.015625*noise( p + sin(time) );

    return f/0.96875;
}

float pattern( vec2 p )
{
    return fbm( p + fbm( p + fbm( p ) ) );
}

void main() {
    vec2 uv = vUv.xy*uResolution.xy/uResolution.x;
    float shade = pattern(uv);
    fragColor = vec4(colormap(shade).rgb * uColor, shade);
}
`;

class Triangle {
  gl: WebGL2RenderingContext;
  vao: WebGLVertexArrayObject | null = null;
  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    const verts = new Float32Array([-1, -1, 3, -1, -1, 3]);
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    const loc = 0;
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  }
  draw() {
    this.gl.bindVertexArray(this.vao);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
    this.gl.bindVertexArray(null);
  }
}

function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Could not create shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || 'Shader compile error');
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext, vertSrc: string, fragSrc: string) {
  const vertShader = createShader(gl, gl.VERTEX_SHADER, vertSrc);
  const fragShader = createShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  const program = gl.createProgram();
  if (!program) throw new Error('Could not create program');
  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);
  gl.bindAttribLocation(program, 0, 'position');
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || 'Program link error');
  }
  return program;
}

interface TranquiluxeProps {
  color?: [number, number, number]; // accent color multiplier
  className?: string;
  style?: React.CSSProperties;
}

export const Tranquiluxe: React.FC<TranquiluxeProps> = ({
  color = [0, 0.6275, 0.8471], // #00a0d8
  className,
  style,
}) => {
  const ctnDom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ctnDom.current) return;

    const ctn = ctnDom.current;
    const canvas = document.createElement('canvas');
    ctn.appendChild(canvas);

    const gl = canvas.getContext('webgl2');
    if (!gl) return;

    function resize() {
      canvas.width = ctn.offsetWidth;
      canvas.height = ctn.offsetHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();

    const triangle = new Triangle(gl);
    const program = createProgram(gl, vert, frag);
    gl.useProgram(program);

    const uTimeLoc = gl.getUniformLocation(program, 'uTime');
    const uColorLoc = gl.getUniformLocation(program, 'uColor');
    const uResolutionLoc = gl.getUniformLocation(program, 'uResolution');

    gl.uniform3fv(uColorLoc, color);

    let running = true;
    function render(t: number) {
      if (!running) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(1, 1, 1, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);
      gl.uniform1f(uTimeLoc, t * 0.001);
      gl.uniform3fv(uColorLoc, color);
      gl.uniform3f(
        uResolutionLoc,
        canvas.width,
        canvas.height,
        canvas.width / Math.max(1, canvas.height)
      );

      triangle.draw();
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    return () => {
      running = false;
      window.removeEventListener('resize', resize);
      ctn.removeChild(canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [color]);

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        inset: 0,
        ...style,
      }}
      ref={ctnDom}
    />
  );
};
