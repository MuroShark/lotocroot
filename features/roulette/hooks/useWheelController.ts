import { useRef, useEffect, useState, useCallback } from 'react';
import { RouletteSegment, GameMode, EliminationMode } from '../types';

interface UseWheelControllerProps {
  segments: RouletteSegment[];
  mode: GameMode;
  subMode: EliminationMode;
  duration: number;
  targetWinnerId: number | null;
  segmentOrderKey: number;
  onSpinFinish: (winner: RouletteSegment) => void;
  onEliminationAnimationFinish: (winner: RouletteSegment) => void;
}

export const useWheelController = ({
  segments,
  mode,
  subMode,
  duration,
  targetWinnerId,
  segmentOrderKey,
  onSpinFinish,
  onEliminationAnimationFinish
}: UseWheelControllerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [pointerText, setPointerText] = useState("Победитель");
  const [isPointerEliminated, setIsPointerEliminated] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // Состояние для оверлея выбывания
  const [eliminationState, setEliminationState] = useState<{show: boolean, name: string}>({
      show: false, 
      name: ''
  });

  const stateRef = useRef({
    segments: [] as RouletteSegment[],
    currentRotation: 0,
    isSpinning: false,
    isEliminating: false,
    mode,
    targetWinnerId
  });

  useEffect(() => {
    const shuffle = (array: RouletteSegment[]) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };
    stateRef.current.segments = segmentOrderKey > 0 ? shuffle(segments) : [...segments];
  }, [segments, segmentOrderKey]);

  useEffect(() => {
    stateRef.current.mode = mode;
    stateRef.current.targetWinnerId = targetWinnerId;
    stateRef.current.isSpinning = isSpinning;
  }, [mode, targetWinnerId, isSpinning]);

  const getSegmentWeight = useCallback((seg: RouletteSegment) => {
    let weight = stateRef.current.mode === 'elimination' ? 1 / (Math.max(seg.amount, 1)) : seg.amount;
    if (seg.animFactor !== undefined) weight *= seg.animFactor;
    return weight;
  }, []);

  const getTotalWeight = useCallback(() => {
    return stateRef.current.segments.reduce((acc, seg) => acc + getSegmentWeight(seg), 0);
  }, [getSegmentWeight]);

  // --- DRAWING ---
  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 10;
    
    ctx.clearRect(0, 0, width, height);

    const currentSegs = stateRef.current.segments;
    if (currentSegs.length === 0) return;

    let totalWeight = getTotalWeight();
    if (totalWeight === 0) totalWeight = currentSegs.length;
    
    let startAngle = stateRef.current.currentRotation - (Math.PI / 2);

    if (stateRef.current.isSpinning && !stateRef.current.isEliminating) {
        const activeAngle = (Math.PI * 2 - (stateRef.current.currentRotation % (Math.PI * 2))) % (Math.PI * 2);
        let tempAngle = 0;
        for(const seg of currentSegs) {
            const weight = getSegmentWeight(seg);
            const segAngle = (weight / totalWeight) * (Math.PI * 2);
            if (activeAngle >= tempAngle && activeAngle < tempAngle + segAngle) {
                setPointerText(seg.name);
                break;
            }
            tempAngle += segAngle;
        }
    }

    currentSegs.forEach(segment => {
      let weight = getSegmentWeight(segment);
      if (getTotalWeight() === 0) weight = 1;

      const sliceAngle = (weight / totalWeight) * (Math.PI * 2);
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      let fillStyle = segment.color;
      if (hoveredId !== null && hoveredId !== segment.id) fillStyle = '#3f3f46';
      
      ctx.fillStyle = fillStyle;
      ctx.fill();
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 4;
      ctx.stroke();

      if (sliceAngle > 0.05) {
        const midAngle = startAngle + (endAngle - startAngle) / 2;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(midAngle);
        
        const textDistance = radius - 45; 
        
        let fontSize = 12; 
        if (sliceAngle > 0.15) fontSize = 14;
        if (sliceAngle > 0.3) fontSize = 18;
        if (sliceAngle > 0.6) fontSize = 22;
        
        if (segment.animFactor !== undefined && segment.animFactor < 1) {
            fontSize *= segment.animFactor;
        }

        if (fontSize > 8) {
            ctx.textAlign = "right";
            ctx.textBaseline = "middle";
            ctx.fillStyle = (hoveredId !== null && hoveredId !== segment.id) ? "rgba(255,255,255,0.3)" : "#fff";
            ctx.font = `700 ${fontSize}px "Inter", sans-serif`;
            
            let text = segment.name;
            if (text.length > 20) text = text.substring(0, 19) + '...';
            
            const maxWidth = radius - 100; 
            ctx.fillText(text, textDistance, 0, maxWidth);
            
            if (fontSize >= 18) {
                 const priceSize = Math.max(10, fontSize * 0.6); 
                 ctx.font = `500 ${priceSize}px "JetBrains Mono", monospace`;
                 ctx.fillStyle = "rgba(255,255,255,0.7)";
                 ctx.fillText(`${segment.amount.toLocaleString()} ₽`, textDistance, fontSize * 1.1);
            }
        }
        ctx.restore();
      }
      startAngle = endAngle;
    });
  }, [getTotalWeight, getSegmentWeight, hoveredId]);

  // Анимация уменьшения (Elimination)
  const animateShrink = useCallback((winnerIdx: number, winner: RouletteSegment) => {
     let animDuration = 1000;
     
     if (duration < 3) {
         animDuration = 0;
     } else if (duration < 5) {
         animDuration = 500;
     }

     // Функция завершения
     const finish = () => {
        stateRef.current.isEliminating = false;
        
        onEliminationAnimationFinish(winner);
        setIsSpinning(false);
        setPointerText("Победитель");
     };

     if (animDuration === 0) {
        if (stateRef.current.segments[winnerIdx]) {
            stateRef.current.segments[winnerIdx].animFactor = 0;
        }
        drawWheel();
        finish();
        return;
     }

     const startAnim = performance.now();
     
     const animate = (time: number) => {
        const elapsed = time - startAnim;
        const p = Math.min(elapsed / animDuration, 1);
        
        if (stateRef.current.segments[winnerIdx]) {
            stateRef.current.segments[winnerIdx].animFactor = 1 - p;
        }
        drawWheel();

        if (p < 1) {
            requestAnimationFrame(animate);
        } else {
            finish();
        }
     };
     requestAnimationFrame(animate);
  }, [drawWheel, onEliminationAnimationFinish, duration]);

  // --- SPIN LOGIC ---
  const spin = useCallback(() => {
    // Сбрасываем оверлей при новом спине (на всякий случай)
    setEliminationState({ show: false, name: '' });
    
    const currentSegments = stateRef.current.segments;
    const currentMode = stateRef.current.mode;
    const currentTargetId = stateRef.current.targetWinnerId;

    if (isSpinning || currentSegments.length === 0) return;
    
    setIsSpinning(true);
    setIsPointerEliminated(false);
    
    let totalWeight = getTotalWeight();
    if (totalWeight === 0 && currentSegments.length > 0) totalWeight = currentSegments.length;
    
    let winnerIndex = -1;

    if (currentMode === 'elimination' && subMode === 'visual' && currentTargetId) {
        const nonTargets = currentSegments.filter(s => s.id !== currentTargetId);
        if (nonTargets.length > 0) {
            const subTotal = nonTargets.reduce((acc, s) => acc + getSegmentWeight(s), 0);
            const rand = Math.random() * subTotal;
            let acc = 0;
            let loser = nonTargets[nonTargets.length - 1];
            for (const s of nonTargets) {
                acc += getSegmentWeight(s);
                if (rand <= acc) { loser = s; break; }
            }
            winnerIndex = currentSegments.findIndex(s => s.id === loser.id);
        } else {
             winnerIndex = currentSegments.findIndex(s => s.id === currentTargetId);
        }
    } else {
        const randomVal = Math.random() * totalWeight;
        let accumulated = 0;
        for(let i=0; i<currentSegments.length; i++) {
            let weight = getSegmentWeight(currentSegments[i]);
            if (getTotalWeight() === 0) weight = 1;
            accumulated += weight;
            if (randomVal <= accumulated) { winnerIndex = i; break; }
        }
    }

    let angleSoFar = 0;
    for(let i=0; i<winnerIndex; i++) {
        let weight = getSegmentWeight(currentSegments[i]);
        if (getTotalWeight() === 0) weight = 1;
        angleSoFar += (weight / totalWeight) * (Math.PI * 2);
    }
    let winnerWeight = getSegmentWeight(currentSegments[winnerIndex]);
    if (getTotalWeight() === 0) winnerWeight = 1;

    const winnerArc = (winnerWeight / totalWeight) * (Math.PI * 2);
    const winnerCenter = angleSoFar + (winnerArc / 2);
    
    const minSpins = Math.max(3, Math.floor((duration) * 0.6));
    const fullRotations = (Math.PI * 2) * minSpins;
    const finalAngle = -winnerCenter + ((Math.random() - 0.5) * (winnerArc * 0.8));
    
    let deltaAngle = finalAngle - (stateRef.current.currentRotation % (Math.PI * 2));
    if (deltaAngle < 0) deltaAngle += (Math.PI * 2);
    deltaAngle += fullRotations;

    const startRot = stateRef.current.currentRotation;
    const startTime = performance.now();
    const spinDuration = duration * 1000;

    const animate = (time: number) => {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        
        stateRef.current.currentRotation = startRot + (deltaAngle * ease);
        drawWheel();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            const winner = currentSegments[winnerIndex];
            setPointerText(winner.name);
            onSpinFinish(winner);
            
            if (currentMode === 'elimination') {
                setIsPointerEliminated(true);
                stateRef.current.isEliminating = true; 
                
                // ПОКАЗЫВАЕМ ОВЕРЛЕЙ
                setEliminationState({ show: true, name: winner.name });
                
                // Запускаем анимацию исчезновения
                animateShrink(winnerIndex, winner);
            } else {
                setIsSpinning(false);
            }
        }
    };
    requestAnimationFrame(animate);
  }, [
    isSpinning, 
    subMode, 
    duration, 
    getTotalWeight, 
    getSegmentWeight, 
    drawWheel, 
    animateShrink, 
    onSpinFinish
  ]);

  useEffect(() => {
    if (!wrapperRef.current || !canvasRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
        const wrapper = wrapperRef.current;
        const canvas = canvasRef.current;
        if(wrapper && canvas) {
            const rect = wrapper.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            const ctx = canvas.getContext('2d');
            if(ctx) ctx.scale(dpr, dpr);
            drawWheel();
        }
    });
    resizeObserver.observe(wrapperRef.current);
    return () => resizeObserver.disconnect();
  }, [drawWheel]);

  useEffect(() => {
    if (isSpinning) return;

    if (hoveredId !== null && !isSpinning) {
      const hoveredSegment = stateRef.current.segments.find(s => s.id === hoveredId);
      if (hoveredSegment && hoveredSegment.name.trim() !== '') {
        setPointerText(hoveredSegment.name);
      } else setPointerText("Победитель");
    } else setPointerText("Победитель");
  }, [hoveredId, isSpinning]);

  useEffect(() => { 
      drawWheel(); 
  }, [drawWheel, segments, mode, subMode]);

  return { 
    canvasRef, 
    wrapperRef, 
    spin, 
    isSpinning, 
    pointerText, 
    isPointerEliminated,
    setHoveredId,
    hoveredId,
    eliminationState // Экспортируем состояние оверлея
  };
};