import { useEffect, useRef } from "react";

export function AnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    containerRef.current.appendChild(canvas);

    let animationId: number;

    // إنشاء مصفوفة قطرات المطر
    const particlesArray: any[] = [];
    const numberOfParticles = 150; // عدد القطرات

    for (let i = 0; i < numberOfParticles; i++) {
      particlesArray.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * 0.8 + 0.2, // العمق (3D) لتحديد الحجم والسرعة
        length: Math.random() * 20 + 10,
        speed: Math.random() * 10 + 5,
      });
    }

    const animate = () => {
      // خلفية زرقاء داكنة جداً مع شفافية لعمل تأثير الحركة (Motion Blur)
      ctx.fillStyle = "rgba(2, 6, 23, 0.3)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // رسم وتحريك المطر
      particlesArray.forEach((p) => {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y + p.length * p.z);
        
        // لون أزرق نيون مع شفافية تعتمد على العمق
        ctx.strokeStyle = `rgba(56, 189, 248, ${p.z})`; 
        ctx.lineWidth = p.z * 2.5; // القطرات القريبة تكون أسمك
        ctx.lineCap = "round";
        ctx.stroke();

        // تحريك القطرة للأسفل
        p.y += p.speed * p.z;

        // إعادة القطرة للأعلى إذا تجاوزت الشاشة
        if (p.y > canvas.height) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      canvas.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10"
      style={{
        // خلفية احتياطية متدرجة كئيبة تناسب المطر
        background: "linear-gradient(to bottom, #020617, #0f172a)",
      }}
    />
  );
}