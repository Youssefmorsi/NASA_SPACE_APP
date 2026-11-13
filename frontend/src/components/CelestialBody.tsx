import { useEffect, useRef } from "react";
import * as T from "three";

// Procedural background artwork, not geographic or ephemeris data.
const vertex = `varying vec3 vPosition; varying vec3 vNormal;
void main(){vPosition=position;vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const fragment = `precision highp float;
varying vec3 vPosition; varying vec3 vNormal; uniform float uTime; uniform float uSun;
float hash(vec3 p){p=fract(p*.3183099+vec3(.13,.31,.71));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5,v=0.;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+vec3(3.1,7.7,1.3);a*=.5;}return v;}
void main(){vec3 p=normalize(vPosition),n=normalize(vNormal);float facing=max(n.z,0.);
if(uSun>.5){
 vec3 warp=p*9.+vec3(uTime*.025,0.,uTime*.018);float cells=fbm(warp+fbm(warp*2.)*1.2);float fine=noise(p*180.+uTime*.06);
 vec3 color=mix(vec3(.78,.18,.018),vec3(1.,.73,.24),smoothstep(.24,.72,cells));color+=fine*.13;
 float limb=.43+.57*pow(facing,.4);gl_FragColor=vec4(color*limb,1.);
}else{
 float continent=fbm(p*2.6+vec3(4.5,2.2,8.));float coast=smoothstep(.47,.5,continent);float detail=fbm(p*35.);
 vec3 ocean=mix(vec3(.012,.07,.18),vec3(.018,.23,.39),smoothstep(.36,.49,continent));
 float desert=smoothstep(.35,.64,fbm(p*7.+vec3(7.)))*(1.-smoothstep(.35,.7,abs(p.y)));
 vec3 land=mix(vec3(.12,.24,.17),vec3(.53,.43,.28),desert);land*=.77+detail*.45;
 vec3 color=mix(ocean,land,coast);
 float ice=smoothstep(.82,.96,abs(p.y)+noise(p*28.)*.055);color=mix(color,vec3(.81,.89,.92),ice);
 vec3 cp=p*7.;cp.x+=sin(p.y*12.+uTime*.025)*.45;cp.z+=uTime*.012;
 float cloud=smoothstep(.48,.69,fbm(cp+fbm(cp*1.8)))*.9;color=mix(color,vec3(.91,.95,1.),cloud);
 vec3 light=normalize(vec3(-.65,.4,.85));float sun=max(dot(n,light),0.);float diffuse=smoothstep(-.08,.32,dot(n,light));
 color*=.055+sun*.95;float spec=pow(max(dot(reflect(-light,n),vec3(0,0,1)),0.),30.)*(1.-coast)*(1.-cloud);color+=vec3(.4,.62,.75)*spec*.35;
 float rim=pow(1.-facing,3.5);color+=vec3(.08,.35,.75)*rim*diffuse*.7;
 gl_FragColor=vec4(color,1.);
}}`;
export default function CelestialBody({ kind }: { kind: "earth" | "sun" }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current!;
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setClearColor(0, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    el.appendChild(renderer.domElement);
    const scene = new T.Scene(),
      camera = new T.OrthographicCamera(-1.13, 1.13, 1.13, -1.13, 0.1, 10);
    camera.position.z = 3;
    const geometry = new T.SphereGeometry(1, 80, 64),
      material = new T.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: {
          uTime: { value: 0 },
          uSun: { value: kind === "sun" ? 1 : 0 },
        },
      });
    const sphere = new T.Mesh(geometry, material);
    sphere.rotation.z = kind === "earth" ? 0.23 : 0;
    scene.add(sphere);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const resize = new ResizeObserver(() => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      renderer.render(scene, camera);
    });
    resize.observe(el);
    let frame = 0,
      last = 0;
    const animate = (t: number) => {
      frame = requestAnimationFrame(animate);
      if (t - last < 60) return;
      last = t;
      material.uniforms.uTime.value = reduced ? 0 : t * 0.001;
      if (!reduced && kind === "earth") sphere.rotation.y = t * 0.000018;
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [kind]);
  return <div className={`celestial-model celestial-${kind}`} ref={host} />;
}
