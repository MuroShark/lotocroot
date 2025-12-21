/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  CaretDown, Plus, X, ArrowUUpLeft, ArrowUUpRight, 
  TextB, TextItalic, TextUnderline, TextStrikethrough, 
  TextAUnderline, Highlighter, Minus, 
  TextAlignLeft, TextAlignCenter, TextAlignRight, 
  ListBullets, ListNumbers, FloppyDisk
} from '@phosphor-icons/react';

// Типы для пресетов
interface RulesPreset {
  id: string;
  name: string;
  content: string;
}

export const RulesPanel: React.FC = () => {
  // --- REFS ---
  const panelRef = useRef<HTMLDivElement>(null); 
  const contentRef = useRef<HTMLDivElement>(null);
  const presetWrapperRef = useRef<HTMLDivElement>(null);
  const floatingToolbarRef = useRef<HTMLDivElement>(null);

  // --- STATE ---
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("Правила (Стандарт)");
  
  // История
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Пресеты
  const [presets, setPresets] = useState<RulesPreset[]>([]);
  const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false);
  const [currentPresetId, setCurrentPresetId] = useState<string | null>(null);
  
  // Форматирование
  const [activeFormats, setActiveFormats] = useState<string[]>([]);
  const [fontSize, setFontSize] = useState(14);
  const savedRange = useRef<Range | null>(null);

  // Floating Toolbar State
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null);
  const [showFloatingBar, setShowFloatingBar] = useState(false);

  // Используем ref для title, чтобы не пересоздавать слушатель событий при каждом нажатии клавиши
  const titleRef = useRef(title);
  useEffect(() => { titleRef.current = title; }, [title]);
  const currentPresetIdRef = useRef(currentPresetId);
  useEffect(() => { currentPresetIdRef.current = currentPresetId; }, [currentPresetId]);

  // --- ACTIONS (Moved up for usage in effects) ---
  const saveCurrentState = useCallback(() => {
    if (!contentRef.current) return;
    localStorage.setItem('auction_rules_current', JSON.stringify({
      content: contentRef.current.innerHTML,
      title: titleRef.current, // Используем ref для актуальности внутри замыканий
      presetId: currentPresetIdRef.current
    }));
  }, []);

  // --- CLICK LISTENERS ---
  useEffect(() => {
    function handleGlobalClick(event: MouseEvent) {
      const target = event.target as Node;

      // Закрытие меню пресетов
      if (isPresetMenuOpen && presetWrapperRef.current && !presetWrapperRef.current.contains(target)) {
        setIsPresetMenuOpen(false);
      }

      // Выход из режима редактирования при клике вне панели
      if (isEditing && panelRef.current && !panelRef.current.contains(target)) {
        // Если клик был по плавающему тулбару — не выходим
        if (floatingToolbarRef.current && floatingToolbarRef.current.contains(target)) {
          return;
        }
        setIsEditing(false);
        setShowFloatingBar(false);
        saveCurrentState();
      }
    }

    document.addEventListener("mousedown", handleGlobalClick);
    return () => {
      document.removeEventListener("mousedown", handleGlobalClick);
    };
  }, [isEditing, isPresetMenuOpen, saveCurrentState]);


  // --- INIT DATA (ЗДЕСЬ ВСТАВЛЕН НОВЫЙ ШАБЛОН) ---
  useEffect(() => {
    const savedCurrent = localStorage.getItem('auction_rules_current');
    
    if (savedCurrent) {
      try {
        const data = JSON.parse(savedCurrent);
        if (data.content && contentRef.current) {
          contentRef.current.innerHTML = data.content;
          setHistoryStack([data.content]);
          setHistoryIndex(0);
        }
        if (data.title) setTitle(data.title);
        if (data.presetId) setCurrentPresetId(data.presetId);
      } catch (e) { console.error(e); }
    } else {
      // ЕСЛИ СОХРАНЕНИЙ НЕТ — ЗАГРУЖАЕМ ШАБЛОН ИЗ HTML
      if (contentRef.current) {
        const defaultContent = `
          <div style="text-align: center;"><h1 style="color: var(--primary);">ПРАВИЛА АУКЦИОНА</h1></div>
          <p style="text-align: center; color: #71717a; font-size: 12px;">(Кликните по тексту, чтобы изменить его под свой стрим)</p>
          <br>
          <h2>1. Условия заказа</h2>
          <ul>
              <li><b>Таймер:</b> 10 минут (+1 мин за донат)</li>
              <li>Минимальный шаг: <span style="color: var(--green); font-weight: bold;">100 ₽</span></li>
              <li><u>Моментальный выкуп</u>: <span style="background-color: rgba(145, 71, 255, 0.2); padding: 0 4px; border-radius: 4px;">5 000 ₽</span></li>
          </ul>
          <br>
          <h2>2. Жанры и игры</h2>
          <p>Мы играем в <i>любые</i> игры, кроме:</p>
          <ol>
              <li><s>Скучные кликеры</s> (Скипаем!)</li>
              <li><span style="color: var(--red);">Запрещенные на платформе</span> игры</li>
          </ol>
          <br>
          <div style="text-align: right;">
              <span style="font-size: 12px; color: #71717a;">GL HF! Пусть победит сильнейший лот!</span>
          </div>
        `;
        
        contentRef.current.innerHTML = defaultContent;
        setHistoryStack([defaultContent]);
        setHistoryIndex(0);
      }
    }

    const savedPresets = localStorage.getItem('auction_rules_presets');
    if (savedPresets) {
      try {
        setPresets(JSON.parse(savedPresets));
      } catch (e) {}
    }
  }, []);

  const recordHistory = useCallback(() => {
    if (!contentRef.current) return;
    const content = contentRef.current.innerHTML;
    if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
    historyDebounceRef.current = setTimeout(() => {
      setHistoryStack(prev => {
        if (historyIndex >= 0 && prev[historyIndex] === content) return prev;
        const newStack = prev.slice(0, historyIndex + 1);
        newStack.push(content);
        if (newStack.length > 50) newStack.shift();
        return newStack;
      });
      setHistoryIndex(prev => (historyStack.length > 50 ? 50 : prev + 1));
      saveCurrentState();
    }, 400);
  }, [historyIndex, historyStack, saveCurrentState]);

  useEffect(() => {
    if (historyStack.length > 0 && historyIndex === -1) {
        setHistoryIndex(historyStack.length - 1);
    }
  }, [historyStack, historyIndex]);

  const undo = () => {
    if (historyIndex > 0 && contentRef.current) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      contentRef.current.innerHTML = historyStack[newIndex];
      saveCurrentState();
    }
  };

  const redo = () => {
    if (historyIndex < historyStack.length - 1 && contentRef.current) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      contentRef.current.innerHTML = historyStack[newIndex];
      saveCurrentState();
    }
  };

  // --- EDITOR COMMANDS ---
  const execCmd = (cmd: string, value: string | undefined = undefined) => {
    document.execCommand(cmd, false, value);
    contentRef.current?.focus();
    updateToolbarState();
    recordHistory();
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (contentRef.current && contentRef.current.contains(range.commonAncestorContainer)) {
        savedRange.current = range;
      }
    }
  };

  const restoreSelection = () => {
    if (savedRange.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRange.current);
      }
    }
  };

  const applyColor = (cmd: string, val: string) => {
    restoreSelection();
    document.execCommand(cmd, false, val);
    saveSelection();
    recordHistory();
  };

  const adjustFontSize = (change: number) => {
    const newSize = fontSize + change;
    if (newSize < 8 || newSize > 72) return;
    setFontSize(newSize);
    document.execCommand('fontSize', false, "7");
    if (contentRef.current) {
      const fontElements = contentRef.current.getElementsByTagName("font");
      for (let i = 0; i < fontElements.length; i++) {
        if (fontElements[i].size === "7") {
          fontElements[i].removeAttribute("size");
          fontElements[i].style.fontSize = `${newSize}px`;
        }
      }
    }
    recordHistory();
  };

  const updateToolbarState = () => {
    const commands = ['bold', 'italic', 'underline', 'strikeThrough', 'justifyLeft', 'justifyCenter', 'justifyRight', 'insertUnorderedList', 'insertOrderedList'];
    const active = commands.filter(cmd => document.queryCommandState(cmd));
    setActiveFormats(active);

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && contentRef.current) {
        let parent: Node | null = sel.getRangeAt(0).commonAncestorContainer;
        if (parent.nodeType === 3 && parent.parentNode) parent = parent.parentNode;
        if (parent && contentRef.current.contains(parent)) {
            const computed = window.getComputedStyle(parent as Element);
            const size = parseInt(computed.fontSize);
            if (!isNaN(size)) setFontSize(size);
        }
    }
  };

  // --- FLOATING TOOLBAR LOGIC ---
  useEffect(() => {
    const handleSelectionChange = () => {
      if (!isEditing) return;

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setShowFloatingBar(false);
        return;
      }

      const range = selection.getRangeAt(0);
      if (contentRef.current && !contentRef.current.contains(range.commonAncestorContainer)) {
        setShowFloatingBar(false);
        return;
      }

      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      setToolbarPos({
        top: rect.top,
        left: rect.left + rect.width / 2
      });
      setShowFloatingBar(true);
      updateToolbarState();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    window.addEventListener('scroll', handleSelectionChange, true);
    window.addEventListener('resize', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      window.removeEventListener('scroll', handleSelectionChange, true);
      window.removeEventListener('resize', handleSelectionChange);
    };
  }, [isEditing]);

  // Preset CRUD
  const savePreset = () => {
    if (!contentRef.current) return;
    const newId = Date.now().toString();
    const newPreset: RulesPreset = { id: newId, name: title || "Без названия", content: contentRef.current.innerHTML };
    const newPresets = [...presets, newPreset];
    setPresets(newPresets);
    setCurrentPresetId(newId);
    localStorage.setItem('auction_rules_presets', JSON.stringify(newPresets));
    setIsPresetMenuOpen(false);
  };

  const updatePreset = () => {
    if (!contentRef.current || !currentPresetId) return;
    const updatedPresets = presets.map(p => 
      p.id === currentPresetId 
        ? { ...p, name: title || "Без названия", content: contentRef.current!.innerHTML }
        : p
    );
    setPresets(updatedPresets);
    localStorage.setItem('auction_rules_presets', JSON.stringify(updatedPresets));
    setIsPresetMenuOpen(false);
  };

  const loadPreset = (preset: RulesPreset) => {
    if (!contentRef.current) return;
    contentRef.current.innerHTML = preset.content;
    setTitle(preset.name);
    setCurrentPresetId(preset.id);
    recordHistory();
    setIsPresetMenuOpen(false);
  };
  const deletePreset = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newPresets = presets.filter(p => p.id !== id);
    setPresets(newPresets);
    if (currentPresetId === id) setCurrentPresetId(null);
    localStorage.setItem('auction_rules_presets', JSON.stringify(newPresets));
  };

  // --- STYLES ---
  const btnBase = "h-7 w-7 flex items-center justify-center rounded text-[#aaa] transition-colors hover:bg-white/10 hover:text-white relative";
  const btnActive = "bg-[rgba(145,71,255,0.2)] text-[#9147ff] border border-[rgba(145,71,255,0.3)]";
  const getBtnClass = (cmd: string) => `${btnBase} ${activeFormats.includes(cmd) ? btnActive : ''}`;

  return (
    <div ref={panelRef} className="flex h-full w-full flex-col bg-[#111] border-r border-[#27272a] transition-colors duration-300">
      
      {/* --- FIXED TOP CONTROLS --- */}
      <div 
        className={`flex flex-col shrink-0 border-b border-[#27272a] bg-[#18181b] transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] relative z-20
        ${isEditing ? 'h-[80px] opacity-100 overflow-visible' : 'h-0 opacity-0 overflow-hidden pointer-events-none'}`}
      >
        {/* Row 1: Title, Undo/Redo, Presets */}
        <div className="flex h-[40px] items-center gap-2 px-4 border-b border-[#27272a]/50">
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); saveCurrentState(); }}
            className="min-w-[40px] flex-1 bg-transparent text-[14px] font-bold text-white outline-none placeholder:text-[#555] focus:border-b focus:border-[var(--primary)] transition-colors truncate"
            placeholder="Название правил..."
          />
          
          <div className="relative" ref={presetWrapperRef}>
            <button 
              onClick={() => setIsPresetMenuOpen(!isPresetMenuOpen)}
              className={`flex h-7 w-7 items-center justify-center rounded border transition-colors ${isPresetMenuOpen ? 'border-[var(--primary)] text-white bg-[rgba(145,71,255,0.1)]' : 'border-[#333] text-[#71717a] hover:bg-[#333] hover:text-white'}`}
              title="Пресеты"
            >
              <CaretDown weight="bold" />
            </button>
            {isPresetMenuOpen && (
              <div className="absolute right-0 top-[110%] w-[220px] rounded-lg border border-[#333] bg-[#18181b] p-1 shadow-2xl z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-200">
                 <button onClick={savePreset} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-[12px] font-semibold text-[var(--primary)] hover:bg-[rgba(145,71,255,0.1)] transition-colors"><Plus weight="bold" /> Сохранить как новый</button>
                 <div className="h-px bg-[#333] my-1" />
                 {presets.length === 0 && <div className="px-2 py-2 text-center text-[11px] text-[#555]">Нет пресетов</div>}
                 <div className="flex flex-col gap-0.5 max-h-[200px] overflow-y-auto customScrollbar">
                   {presets.map(preset => {
                     const isCurrent = preset.id === currentPresetId;
                     return (
                       <div 
                         key={preset.id} 
                         className={`group flex items-center justify-between rounded px-2 py-1.5 text-[12px] cursor-pointer transition-colors ${isCurrent ? 'bg-[rgba(145,71,255,0.15)] text-white' : 'text-[#e4e4e7] hover:bg-[#27272a]'}`} 
                         onClick={() => loadPreset(preset)}
                       >
                          <span className="truncate max-w-[120px]">{preset.name}</span>
                          <div className="flex items-center gap-1">
                            {isCurrent && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); updatePreset(); }} 
                                className="flex h-5 w-5 items-center justify-center rounded text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors"
                                title="Сохранить изменения"
                              >
                                <FloppyDisk weight="bold" className="text-[12px]" />
                              </button>
                            )}
                            <button 
                              onClick={(e) => deletePreset(e, preset.id)} 
                              className={`flex h-5 w-5 items-center justify-center rounded transition-colors ${isCurrent ? 'text-white/50 hover:bg-[#ef4444] hover:text-white' : 'hidden group-hover:flex text-[#71717a] hover:bg-[#ef4444] hover:text-white'}`}
                            >
                              <X weight="bold" className="text-[10px]" />
                            </button>
                          </div>
                       </div>
                     );
                   })}
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Paragraph Controls */}
        <div className="flex h-[40px] items-center gap-2 px-4 bg-[#141416]">
          <div className="flex items-center gap-0.5 border-r border-[#333] pr-2 mr-0.5">
            <button onClick={undo} disabled={historyIndex <= 0} className={`${btnBase} disabled:opacity-30 disabled:hover:bg-transparent`}><ArrowUUpLeft weight="bold" /></button>
            <button onClick={redo} disabled={historyIndex >= historyStack.length - 1} className={`${btnBase} disabled:opacity-30 disabled:hover:bg-transparent`}><ArrowUUpRight weight="bold" /></button>
          </div>

          <div className="flex items-center gap-0.5 border-r border-[#333] pr-2 mr-0.5">
            <button onClick={() => execCmd('justifyLeft')} className={getBtnClass('justifyLeft')}><TextAlignLeft weight="bold" /></button>
            <button onClick={() => execCmd('justifyCenter')} className={getBtnClass('justifyCenter')}><TextAlignCenter weight="bold" /></button>
            <button onClick={() => execCmd('justifyRight')} className={getBtnClass('justifyRight')}><TextAlignRight weight="bold" /></button>
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={() => execCmd('insertUnorderedList')} className={getBtnClass('insertUnorderedList')}><ListBullets weight="bold" /></button>
            <button onClick={() => execCmd('insertOrderedList')} className={getBtnClass('insertOrderedList')}><ListNumbers weight="bold" /></button>
          </div>
        </div>
      </div>

      {/* --- CONTENT EDITOR --- */}
      <div 
        ref={contentRef}
        className={`customScrollbar flex-1 overflow-y-auto p-6 text-[14px] leading-relaxed text-[#e4e4e7] outline-none transition-colors duration-200 
          ${isEditing ? 'bg-[#141416] cursor-text' : 'bg-[#111] cursor-pointer hover:bg-[#141416]'}`}
        contentEditable={isEditing}
        spellCheck={false}
        suppressContentEditableWarning={true}
        onInput={recordHistory}
        onKeyUp={updateToolbarState}
        onMouseUp={updateToolbarState}
        onClick={(e) => {
          if (!isEditing) {
             setIsEditing(true); 
             setTimeout(() => contentRef.current?.focus(), 0);
          }
          updateToolbarState();
        }}
        style={{ fontFamily: 'Inter, sans-serif' }}
      />

      {/* --- FLOATING TOOLBAR (PORTAL) --- */}
      {showFloatingBar && toolbarPos && createPortal(
        <div 
          ref={floatingToolbarRef}
          className="fixed z-[9999] flex flex-col gap-1 rounded-lg border border-[#333] bg-[#18181b]/95 backdrop-blur-md p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          style={{ 
            top: toolbarPos.top, 
            left: toolbarPos.left, 
            transform: 'translate(-50%, -100%) translateY(-12px)' 
          }}
          onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
        >
          {/* Row 1: Formatting & Colors */}
          <div className="flex items-center gap-1">
            <button onClick={() => execCmd('bold')} className={getBtnClass('bold')}><TextB weight="bold" /></button>
            <button onClick={() => execCmd('italic')} className={getBtnClass('italic')}><TextItalic weight="bold" /></button>
            <button onClick={() => execCmd('underline')} className={getBtnClass('underline')}><TextUnderline weight="bold" /></button>
            <button onClick={() => execCmd('strikeThrough')} className={getBtnClass('strikeThrough')}><TextStrikethrough weight="bold" /></button>
            <div className="w-px h-4 bg-white/10 mx-0.5" />
            <div className={`${btnBase} overflow-hidden`}>
              <TextAUnderline weight="bold" className="z-10 pointer-events-none" />
              <input type="color" className="absolute inset-0 h-full w-full opacity-0 cursor-pointer z-20" onMouseDown={saveSelection} onChange={(e) => applyColor('foreColor', e.target.value)} />
            </div>
            <div className={`${btnBase} overflow-hidden`}>
              <Highlighter weight="bold" className="z-10 pointer-events-none" />
              <input type="color" className="absolute inset-0 h-full w-full opacity-0 cursor-pointer z-20" onMouseDown={saveSelection} onChange={(e) => applyColor('hiliteColor', e.target.value)} />
            </div>
            <div className="w-px h-4 bg-white/10 mx-0.5" />
            <div className="flex items-center gap-0.5">
              <button onClick={() => adjustFontSize(-2)} className={btnBase}><Minus weight="bold" /></button>
              <div className="flex h-6 w-7 items-center justify-center rounded bg-white/5 text-[10px] font-mono text-white">{fontSize}</div>
              <button onClick={() => adjustFontSize(2)} className={btnBase}><Plus weight="bold" /></button>
            </div>
          </div>

          {/* Arrow indicator */}
          <div className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 translate-y-1/2 rotate-45 border-b border-r border-[#333] bg-[#18181b]"></div>
        </div>,
        document.body
      )}
    </div>
  );
};