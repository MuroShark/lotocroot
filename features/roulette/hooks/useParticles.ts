import { useRef } from 'react';

const PALETTE = ['#b91c1c', '#c2410c', '#b45309', '#15803d', '#0e7490', '#1d4ed8', '#7e22ce', '#be123c'];

export const useParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const explode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const particles: any[] = [];
    for (let i = 0; i < 100; i++) {
        particles.push({
            x: window.innerWidth / 2, y: window.innerHeight / 2,
            vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20,
            size: Math.random() * 8 + 4, 
            color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
            life: 1.0, decay: Math.random() * 0.02 + 0.01
        });
    }

    const loop = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.vx *= 0.95; p.life -= p.decay;
            ctx.globalAlpha = p.life; 
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
            if (p.life <= 0) particles.splice(i, 1);
        }
        ctx.globalAlpha = 1;
        if (particles.length > 0) requestAnimationFrame(loop);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    loop();
  };

  return { particleCanvasRef: canvasRef, explode };
};