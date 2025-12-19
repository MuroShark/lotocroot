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

interface CachedSegment {
    endAngle: number;
    name: string;
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
  const pointerRef = useRef<HTMLDivElement>(null);

  const rotationRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastPointerTextRef = useRef<string>("");
  const lastTextUpdateRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [isPointerEliminated, setIsPointerEliminated] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const [eliminationState, setEliminationState] = useState<{show: boolean, name: string}>({
      show: false, 
      name: ''
  });

  const stateRef = useRef({
    segments: [] as RouletteSegment[],
    mode,
    targetWinnerId,
    dirty: true 
  });

  // --- Helpers ---
  const updatePointerText = useCallback((text: string, forceUpdate = false) => {
      if (!forceUpdate && lastPointerTextRef.current === text) return;
      lastPointerTextRef.current = text;

      if (pointerRef.current) {
          if (pointerRef.current.firstChild && pointerRef.current.firstChild.nodeType === Node.TEXT_NODE) {
              pointerRef.current.firstChild.textContent = text;
          } else {
               const children = Array.from(pointerRef.current.childNodes);
               const textNode = children.find(n => n.nodeType === Node.TEXT_NODE);
               if (textNode) textNode.textContent = text;
               else pointerRef.current.prepend(document.createTextNode(text));
          }
          const shouldHide = text.trim() === "" || (text === "Победитель" && isSpinning);
          pointerRef.current.style.opacity = shouldHide ? '0' : '1';
      }
  }, [isSpinning]);

  const getSegmentWeight = useCallback((seg: RouletteSegment) => {
    let weight = stateRef.current.mode === 'elimination' ? 1 / (Math.max(seg.amount, 1)) : seg.amount;
    if (seg.animFactor !== undefined) weight *= seg.animFactor;
    return weight;
  }, []);

  const getTotalWeight = useCallback(() => {
    return stateRef.current.segments.reduce((acc, seg) => acc + getSegmentWeight(seg), 0);
  }, [getSegmentWeight]);

  // --- Drawing ---
  const drawWheelStatic = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = wrapperRef.current?.getBoundingClientRect(); 
    if (!rect || rect.width < 20 || rect.height < 20) return;

    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ВАЖНО: imageSmoothingEnabled для Retina экранов
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 10;

    const currentSegs = stateRef.current.segments;
    if (currentSegs.length === 0) return;

    let totalWeight = getTotalWeight();
    if (totalWeight === 0) totalWeight = currentSegs.length;

    let startAngle = -Math.PI / 2;

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
      // ОПТИМИЗАЦИЯ: stroke иногда вызывает артефакты ("лесенку") при вращении.
      // Если сегментов много, можно попробовать убрать stroke или сделать его тоньше.
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

  // --- Effects ---
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
    stateRef.current.dirty = true;
    drawWheelStatic();
  }, [segments, segmentOrderKey, drawWheelStatic]);

  useEffect(() => {
    stateRef.current.mode = mode;
    stateRef.current.targetWinnerId = targetWinnerId;
    stateRef.current.dirty = true; 
    drawWheelStatic();
  }, [mode, targetWinnerId, drawWheelStatic]);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const observer = new ResizeObserver(() => {
        window.requestAnimationFrame(() => drawWheelStatic());
    });
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, [drawWheelStatic]);

  useEffect(() => {
    drawWheelStatic();
     if (hoveredId !== null && !isSpinning) {
        const seg = stateRef.current.segments.find(s => s.id === hoveredId);
        if (seg) updatePointerText(seg.name, true);
     } else if (!isSpinning) {
        updatePointerText("Победитель", true);
     }
  }, [hoveredId, isSpinning, drawWheelStatic, updatePointerText]);

  // --- Animations ---
  const animateShrink = useCallback((winnerIdx: number, winner: RouletteSegment) => {
     let animDuration = 1000;
     if (duration < 3) animDuration = 0; else if (duration < 5) animDuration = 500;
     
     if (animDuration === 0) {
         if (stateRef.current.segments[winnerIdx]) stateRef.current.segments[winnerIdx].animFactor = 0;
         drawWheelStatic();
         onEliminationAnimationFinish(winner);
         setIsSpinning(false);
         return;
     }

     const startAnim = performance.now();
     const animate = (time: number) => {
         const elapsed = time - startAnim;
         const p = Math.min(elapsed / animDuration, 1);
         if (stateRef.current.segments[winnerIdx]) {
             stateRef.current.segments[winnerIdx].animFactor = 1 - p;
         }
         drawWheelStatic(); 
         if (p < 1) requestAnimationFrame(animate);
         else {
             onEliminationAnimationFinish(winner);
             setIsSpinning(false);
             updatePointerText("Победитель", true);
         }
     };
     requestAnimationFrame(animate);
  }, [duration, onEliminationAnimationFinish, drawWheelStatic, updatePointerText]);

  // --- Spin Logic ---
  const spin = useCallback(() => {
    const currentSegments = stateRef.current.segments;
    if (isSpinning || currentSegments.length === 0) return;

    setEliminationState({ show: false, name: '' });
    setIsSpinning(true);
    setIsPointerEliminated(false);

    let totalWeight = getTotalWeight();
    if (totalWeight === 0 && currentSegments.length > 0) totalWeight = currentSegments.length;
    
    const segmentsMap: CachedSegment[] = [];
    let tempMapAngle = 0;
    for (const seg of currentSegments) {
        const weight = getSegmentWeight(seg);
        const segAngle = (weight / totalWeight) * (Math.PI * 2);
        tempMapAngle += segAngle;
        segmentsMap.push({ endAngle: tempMapAngle, name: seg.name });
    }

    let winnerIndex = -1;
    if (stateRef.current.mode === 'elimination' && subMode === 'visual' && stateRef.current.targetWinnerId) {
         winnerIndex = currentSegments.findIndex(s => s.id === stateRef.current.targetWinnerId);
         if(winnerIndex === -1) winnerIndex = Math.floor(Math.random() * currentSegments.length);
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

    let angleToWinnerStart = 0;
    if (winnerIndex > 0) {
        angleToWinnerStart = segmentsMap[winnerIndex - 1].endAngle;
    }
    
    let winnerWeight = getSegmentWeight(currentSegments[winnerIndex]);
    if (getTotalWeight() === 0) winnerWeight = 1;
    const winnerArc = (winnerWeight / totalWeight) * (Math.PI * 2);
    const winnerCenterAngle = angleToWinnerStart + (winnerArc / 2);
    
    const randomOffset = (Math.random() - 0.5) * (winnerArc * 0.8);
    const minSpins = Math.max(3, Math.floor((duration) * 0.6));
    const fullSpinsRotation = (Math.PI * 2) * minSpins;
    
    const currentVisualAngle = rotationRef.current % (Math.PI * 2);
    const angleToCompleteTurn = (Math.PI * 2) - currentVisualAngle;
    const targetRotationDelta = angleToCompleteTurn + fullSpinsRotation + ((Math.PI * 2) - winnerCenterAngle) + randomOffset;
    
    const startRotation = rotationRef.current;
    const startTime = performance.now();
    const spinDuration = duration * 1000;

    lastFrameTimeRef.current = performance.now();

    const animate = (time: number) => {
        // --- ДИАГНОСТИКА: Порог снижен до 9 мс для 120Hz ---
        const now = performance.now();
        const delta = now - lastFrameTimeRef.current;
        if (delta > 9.5) { // <--- ЧУВСТВИТЕЛЬНОСТЬ
            console.warn(`🔴 Dropped Frame (120Hz): ${delta.toFixed(2)}ms`);
        }
        lastFrameTimeRef.current = now;
        
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);
        const ease = 1 - Math.pow(1 - progress, 3); 
        
        const currentRot = startRotation + (targetRotationDelta * ease);
        rotationRef.current = currentRot;

        if (canvasRef.current) {
            // ОПТИМИЗАЦИЯ: Убрали toFixed(), используем translate3d для GPU
            canvasRef.current.style.transform = `translate3d(0,0,0) rotate(${currentRot}rad)`;
        }

        if (time - lastTextUpdateRef.current > 50) {
            const normalizedRot = currentRot % (Math.PI * 2);
            const effectiveAngle = (Math.PI * 2 - normalizedRot) % (Math.PI * 2);
            const activeSeg = segmentsMap.find(s => effectiveAngle < s.endAngle);
            if (activeSeg) updatePointerText(activeSeg.name, false);
            lastTextUpdateRef.current = time;
        }

        if (progress < 1) {
            animationFrameRef.current = requestAnimationFrame(animate);
        } else {
            const winner = currentSegments[winnerIndex];
            updatePointerText(winner.name, true); 
            onSpinFinish(winner);

             if (stateRef.current.mode === 'elimination') {
                setIsPointerEliminated(true);
                setEliminationState({ show: true, name: winner.name });
                animateShrink(winnerIndex, winner);
            } else {
                setIsSpinning(false);
            }
        }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

  }, [isSpinning, subMode, duration, getTotalWeight, getSegmentWeight, updatePointerText, onSpinFinish, animateShrink]);


  useEffect(() => {
      return () => {
          if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };
  }, []);

  return { 
    canvasRef, wrapperRef, pointerRef, spin, isSpinning, 
    isPointerEliminated, setHoveredId, hoveredId, eliminationState 
  };
};