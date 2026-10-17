(() => {
  const host = document.querySelector('[data-soft-aurora]');
  if (!host) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'soft-aurora-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false });
  if (!gl) { host.classList.add('soft-aurora-fallback'); return; }

  const vertex = `attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}`;
  const fragment = `
    precision highp float;
    uniform float uTime,uSpeed,uScale,uBrightness,uNoiseFreq,uNoiseAmp,uBandHeight,uBandSpread,uOctaveDecay,uLayerOffset,uColorSpeed,uMouseInfluence;
    uniform vec3 uResolution,uColor1,uColor2;
    uniform vec2 uMouse;
    uniform bool uEnableMouse;
    #define TAU 6.28318
    vec3 gradientHash(vec3 p){p=vec3(dot(p,vec3(127.1,311.7,234.6)),dot(p,vec3(269.5,183.3,198.3)),dot(p,vec3(169.5,283.3,156.9)));vec3 h=fract(sin(p)*43758.5453123);float phi=acos(2.*h.x-1.),theta=TAU*h.y;return vec3(cos(theta)*sin(phi),sin(theta)*cos(phi),cos(phi));}
    float quinticSmooth(float t){float t2=t*t,t3=t*t2;return 6.*t3*t2-15.*t2*t2+10.*t3;}
    vec3 cosineGradient(float t,vec3 a,vec3 b,vec3 c,vec3 d){return a+b*cos(TAU*(c*t+d));}
    float perlin3D(float amplitude,float frequency,float px,float py,float pz){
      float x=px*frequency,y=py*frequency;float fx=floor(x),fy=floor(y),fz=floor(pz),cx=ceil(x),cy=ceil(y),cz=ceil(pz);
      vec3 g000=gradientHash(vec3(fx,fy,fz)),g100=gradientHash(vec3(cx,fy,fz)),g010=gradientHash(vec3(fx,cy,fz)),g110=gradientHash(vec3(cx,cy,fz)),g001=gradientHash(vec3(fx,fy,cz)),g101=gradientHash(vec3(cx,fy,cz)),g011=gradientHash(vec3(fx,cy,cz)),g111=gradientHash(vec3(cx,cy,cz));
      float d000=dot(g000,vec3(x-fx,y-fy,pz-fz)),d100=dot(g100,vec3(x-cx,y-fy,pz-fz)),d010=dot(g010,vec3(x-fx,y-cy,pz-fz)),d110=dot(g110,vec3(x-cx,y-cy,pz-fz)),d001=dot(g001,vec3(x-fx,y-fy,pz-cz)),d101=dot(g101,vec3(x-cx,y-fy,pz-cz)),d011=dot(g011,vec3(x-fx,y-cy,pz-cz)),d111=dot(g111,vec3(x-cx,y-cy,pz-cz));
      float sx=quinticSmooth(x-fx),sy=quinticSmooth(y-fy),sz=quinticSmooth(pz-fz);return amplitude*mix(mix(mix(d000,d100,sx),mix(d010,d110,sx),sy),mix(mix(d001,d101,sx),mix(d011,d111,sx),sy),sz);
    }
    float auroraGlow(float t,vec2 shift){vec2 uv=gl_FragCoord.xy/uResolution.y+shift;float noiseVal=0.,freq=uNoiseFreq,amp=uNoiseAmp;vec2 samplePos=uv*uScale;for(float i=0.;i<3.;i+=1.){noiseVal+=perlin3D(amp,freq,samplePos.x,samplePos.y,t);amp*=uOctaveDecay;freq*=2.;}float yBand=uv.y*10.-uBandHeight*10.;return .3*max(exp(uBandSpread*(1.-1.1*abs(noiseVal+yBand))),0.);}
    void main(){vec2 uv=gl_FragCoord.xy/uResolution.xy;float t=uSpeed*.4*uTime;vec2 shift=vec2(0.);if(uEnableMouse){shift=(uMouse-.5)*uMouseInfluence;}float glow1=auroraGlow(t,shift),glow2=auroraGlow(t+uLayerOffset,shift);vec3 gradient1=cosineGradient(uv.x+uTime*uSpeed*.2*uColorSpeed,vec3(.5),vec3(.5),vec3(1.),vec3(.3,.2,.2));vec3 gradient2=cosineGradient(uv.x+uTime*uSpeed*.1*uColorSpeed,vec3(.5),vec3(.5),vec3(2.,1.,0.),vec3(.5,.2,.25));vec3 col=.99*glow1*gradient1*uColor1+.99*glow2*gradient2*uColor2;col*=uBrightness;gl_FragColor=vec4(col,clamp(length(col),0.,1.));}
  `;
  const compile = (type, source) => { const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader); if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader)); return shader; };
  let program;
  try { program = gl.createProgram(); gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex)); gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment)); gl.linkProgram(program); if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program)); }
  catch (error) { console.warn('Soft Aurora unavailable:', error); canvas.remove(); host.classList.add('soft-aurora-fallback'); return; }
  gl.useProgram(program);
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position'); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const location = name => gl.getUniformLocation(program, name);
  const u = { time:location('uTime'),resolution:location('uResolution'),speed:location('uSpeed'),scale:location('uScale'),brightness:location('uBrightness'),color1:location('uColor1'),color2:location('uColor2'),noiseFreq:location('uNoiseFreq'),noiseAmp:location('uNoiseAmp'),bandHeight:location('uBandHeight'),bandSpread:location('uBandSpread'),octaveDecay:location('uOctaveDecay'),layerOffset:location('uLayerOffset'),colorSpeed:location('uColorSpeed'),mouse:location('uMouse'),mouseInfluence:location('uMouseInfluence'),enableMouse:location('uEnableMouse') };
  gl.uniform1f(u.speed,.6); gl.uniform1f(u.scale,1.5); gl.uniform1f(u.brightness,1); gl.uniform3f(u.color1,247/255,247/255,247/255); gl.uniform3f(u.color2,225/255,0,1); gl.uniform1f(u.noiseFreq,2.5); gl.uniform1f(u.noiseAmp,1); gl.uniform1f(u.bandHeight,.5); gl.uniform1f(u.bandSpread,1); gl.uniform1f(u.octaveDecay,.1); gl.uniform1f(u.layerOffset,0); gl.uniform1f(u.colorSpeed,1); gl.uniform1f(u.mouseInfluence,.25); gl.uniform1i(u.enableMouse,1);
  let targetMouse=[.5,.5],currentMouse=[.5,.5],frame=0,visible=false;
  const resize=()=>{const ratio=Math.min(devicePixelRatio||1,2),width=Math.max(1,Math.round(host.clientWidth*ratio)),height=Math.max(1,Math.round(host.clientHeight*ratio));if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height);}gl.uniform3f(u.resolution,width,height,width/height);};
  const render=time=>{resize();currentMouse[0]+=.05*(targetMouse[0]-currentMouse[0]);currentMouse[1]+=.05*(targetMouse[1]-currentMouse[1]);gl.uniform1f(u.time,time*.001);gl.uniform2f(u.mouse,currentMouse[0],currentMouse[1]);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,3);frame=visible?requestAnimationFrame(render):0;};
  host.addEventListener('pointermove',event=>{const rect=host.getBoundingClientRect();targetMouse=[(event.clientX-rect.left)/rect.width,1-(event.clientY-rect.top)/rect.height];});
  host.addEventListener('pointerleave',()=>{targetMouse=[.5,.5];});
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible&&!frame)frame=requestAnimationFrame(render);if(!visible&&frame){cancelAnimationFrame(frame);frame=0;}},{rootMargin:'120px'}).observe(host);
})();
