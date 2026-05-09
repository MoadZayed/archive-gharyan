import { useRef, useMemo, Suspense, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Float, Sphere, Cloud, Stars } from "@react-three/drei";
import { motion, AnimatePresence, useInView, useMotionValue, useTransform, animate, useMotionValueEvent } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Rocket, 
  Flower, 
  Box, 
  GraduationCap, 
  Cpu, 
  BookOpen, 
  ChevronRight,
  Star,
  Trophy,
  Globe,
  User
} from "lucide-react";
import * as THREE from "three";
import { useGender } from "@/contexts/GenderContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

// --- 3D Components ---

function Butterfly3D({ color, delay }: { color: string, delay: number }) {
  const ref = useRef<THREE.Group>(null);
  const leftWing = useRef<THREE.Mesh>(null);
  const rightWing = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() + delay; 
    if (ref.current) {
      ref.current.position.x = Math.sin(t * 0.8) * 6;
      ref.current.position.y = Math.cos(t * 0.5) * 4;
      ref.current.position.z = Math.sin(t * 0.3) * 3;
      ref.current.rotation.z = Math.sin(t * 2) * 0.3;
      ref.current.rotation.y = t * 0.5;
    }
    if (leftWing.current && rightWing.current) {
      const flap = Math.sin(t * 20) * 1.1;
      leftWing.current.rotation.y = flap;
      rightWing.current.rotation.y = -flap;
    }
  });

  return (
    <group ref={ref}>
      <mesh><cylinderGeometry args={[0.015, 0.015, 0.15, 8]} /><meshBasicMaterial color="#222" /></mesh>
      <mesh ref={leftWing} position={[-0.08, 0, 0]}><planeGeometry args={[0.16, 0.22]} /><meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.8} /></mesh>
      <mesh ref={rightWing} position={[0.08, 0, 0]}><planeGeometry args={[0.16, 0.22]} /><meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.8} /></mesh>
    </group>
  );
}

function TechEnvironment() {
  const points = useMemo(() => {
    const p = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) {
      p[i * 3] = (Math.random() - 0.5) * 10;
      p[i * 3 + 1] = (Math.random() - 0.5) * 10;
      p[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return p;
  }, []);

  const ref = useRef<any>(null);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      ref.current.rotation.x = t * 0.05;
      ref.current.rotation.y = t * 0.03;
    }
  });

  return (
    <>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Points ref={ref} positions={points} stride={3} frustumCulled={false}>
        <PointMaterial transparent color="#3b82f6" size={0.05} sizeAttenuation={true} depthWrite={false} blending={THREE.AdditiveBlending} />
      </Points>
      <Float speed={2} rotationIntensity={1} floatIntensity={2}>
        <Sphere args={[1.5, 16, 16]} position={[2, 1, -2]}>
          <meshStandardMaterial color="#1e3a8a" wireframe />
        </Sphere>
      </Float>
    </>
  );
}

function SoftEnvironment() {
  return (
    <>
      <ambientLight intensity={1.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#fff" />
      {Array.from({ length: 30 }).map((_, i) => (
        <Float key={i} speed={1.5} rotationIntensity={3} floatIntensity={2}>
          <mesh position={[(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 10]}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshStandardMaterial color={i % 2 === 0 ? "#ff80ab" : "#fce4ec"} emissive={i % 2 === 0 ? "#ff80ab" : "#fce4ec"} emissiveIntensity={0.6} />
          </mesh>
        </Float>
      ))}
      <Cloud opacity={0.3} speed={0.2} position={[-10, 6, -15]} color="#8d6470ff" />
      {Array.from({ length: 12 }).map((_, i) => (
        <Butterfly3D key={i} color={i % 3 === 0 ? "#ff4081" : i % 3 === 1 ? "#ff80ab" : "#f48fb1"} delay={i * 20} />
      ))}
      <Stars radius={100} depth={50} count={1200} factor={4} saturation={1} fade speed={2} />
    </>
  );
}

// --- UI Components ---

const VibeCard = ({ type, title, subtitle, icon: Icon, onHover, onRegister, onLogin }: any) => (
  <motion.div
    onMouseEnter={onHover}
    whileHover={{ scale: 1.05, y: -10 }}
    className={`relative group p-10 md:p-14 rounded-[3rem] shadow-2xl transition-all duration-700 bg-white border-4 ${
      type === 'female' ? 'border-pink-100' : 'border-blue-50'
    }`}
  >
    <div className="relative z-10 flex flex-col items-center text-center">
      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-8 shadow-lg transition-all duration-700 ${
        type === 'female' ? 'bg-pink-500 text-white shadow-pink-200' : 'bg-blue-600 text-white shadow-blue-200'
      }`}>
        <Icon size={40} />
      </div>
      <h3 className={`text-3xl font-black mb-4 ${type === 'female' ? 'text-pink-600' : 'text-blue-600'}`}>{title}</h3>
      <p className={`text-sm font-bold leading-relaxed mb-10 ${type === 'female' ? 'text-pink-900/60' : 'text-slate-600'}`}>{subtitle}</p>
      
      <div className="flex flex-col w-full gap-4">
        <Button 
          onClick={onRegister}
          className={`h-14 rounded-2xl font-black text-base shadow-xl transition-all transform hover:scale-105 active:scale-95 ${
            type === 'female' ? 'bg-pink-500 hover:bg-pink-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          {type === 'female' ? 'ابدئي الآن 🌸' : 'ابدأ الآن 🛡️'}
        </Button>
        <button 
          onClick={onLogin}
          className={`text-sm font-black uppercase tracking-widest transition-all hover:underline underline-offset-4 ${
            type === 'female' ? 'text-pink-500' : 'text-blue-600'
          }`}
        >
          لديكِ حساب؟ سجلي دخولك
        </button>
      </div>
    </div>
  </motion.div>
);

// --- Main Page ---

export default function Home() {
  const [, navigate] = useLocation();
  const { genderTheme, toggleGender } = useGender();
  const { user } = useAuth();
  const [activeVibe, setActiveVibe] = useState<'neutral' | 'female' | 'male'>('neutral');

  useEffect(() => {
    if (user) {
      navigate("/files");
    }
  }, [user, navigate]);

  useDocumentTitle("الرئيسية");

  const statsQuery = trpc.stats.getPlatformStats.useQuery();
  const stats = statsQuery.data || { students: 0, files: 0, aiFeatures: 3 };

  const isFemaleVibe = activeVibe === 'female' || (activeVibe === 'neutral' && genderTheme === 'female');

  return (
    <div className={`min-h-screen transition-colors duration-1000 overflow-x-hidden relative ${isFemaleVibe ? 'bg-[#fff0f6]' : 'bg-[#020617]'}`} dir="rtl">
      
      {/* 3D Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-1000">
        <Suspense fallback={null}>
          <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
            <ambientLight intensity={0.5} />
            {isFemaleVibe ? <SoftEnvironment /> : <TechEnvironment />}
          </Canvas>
        </Suspense>
      </div>

      <header className="relative z-50 flex items-center justify-between px-8 py-8 w-full max-w-7xl mx-auto" dir="ltr">
        <nav className="flex items-center gap-6" aria-label="اختيار المظهر">
          <div className={`flex items-center gap-2 backdrop-blur-2xl border p-1 rounded-full px-2 shadow-2xl transition-all duration-500 ${
            isFemaleVibe ? 'bg-pink-100/50 border-pink-200' : 'bg-white/5 border-white/10'
          }`}>
            <div className="flex gap-1" role="radiogroup" aria-label="سمة المنصة">
              <button 
                onClick={() => { if(genderTheme !== 'male') toggleGender(); }}
                aria-checked={genderTheme === 'male'}
                role="radio"
                aria-label="تفعيل سمة الطلبة"
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all duration-500 ${
                  genderTheme === 'male' 
                    ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-105' 
                    : isFemaleVibe ? 'text-pink-950/40 hover:text-pink-950 hover:bg-pink-200/50' : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                الطلبة
              </button>
              <button 
                onClick={() => { if(genderTheme !== 'female') toggleGender(); }}
                aria-checked={genderTheme === 'female'}
                role="radio"
                aria-label="تفعيل سمة الطالبات"
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all duration-500 ${
                  genderTheme === 'female' 
                    ? 'bg-pink-600 text-white shadow-[0_0_20px_rgba(236,72,153,0.4)] scale-105' 
                    : isFemaleVibe ? 'text-pink-950/40 hover:text-pink-950 hover:bg-pink-200/50' : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                الطالبات
              </button>
            </div>
          </div>
        </nav>
        <Logo className={isFemaleVibe ? 'text-pink-500' : 'text-blue-500'} />
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <h1 className={`text-6xl md:text-[7.5rem] font-black leading-[1.05] tracking-tighter select-none pb-8 ${isFemaleVibe ? 'text-foreground' : 'text-white'}`}>
            مش مجرد منصة قراية..<br />
            <span className={`text-transparent bg-clip-text bg-gradient-to-r ${
              isFemaleVibe 
                ? 'from-pink-600 via-purple-600 to-indigo-600' 
                : 'from-blue-500 via-indigo-500 to-purple-500'
            }`}>
              هني مجتمعك الأكاديمي<br />اللي يجمعنا
            </span>
          </h1>

          <p className={`text-lg md:text-2xl font-bold mt-16 transition-colors duration-1000 tracking-[0.2em] uppercase ${
            isFemaleVibe ? 'text-foreground' : 'text-white/80'
          }`}>
            كلية تقنية المعلومات - غريان
          </p>

          <div className="pt-16 flex flex-col sm:flex-row gap-6 justify-center items-center">
            <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/register")}
              className={`relative group px-12 md:px-16 py-6 rounded-3xl font-black text-xl transition-all duration-500 overflow-hidden shadow-2xl border-2 w-full sm:w-auto ${
                isFemaleVibe ? 'border-pink-400/30' : 'border-blue-400/30'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r transition-all duration-500 ${
                isFemaleVibe 
                  ? 'from-pink-600 via-rose-600 to-purple-700' 
                  : 'from-blue-700 via-indigo-600 to-purple-800'
              }`} />
              <span className="relative z-10 text-white flex items-center justify-center gap-3">
                ادخل للمنصة من هنا {isFemaleVibe ? <Flower size={24} /> : <Rocket size={24} />}
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/login")}
              className={`px-10 md:px-12 py-6 rounded-3xl font-black text-xl transition-all duration-500 border-2 backdrop-blur-xl w-full sm:w-auto ${
                isFemaleVibe 
                  ? 'border-pink-500/50 text-pink-950 hover:bg-pink-100/80' 
                  : 'border-white/30 text-white hover:bg-white/10'
              }`}
            >
              لدي حساب بالفعل
            </motion.button>
          </div>
        </motion.div>

      </main>

      <Footer />
    </div>
  );
}