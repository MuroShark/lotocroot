/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useRef, useEffect, useCallback } from "react";
// Импортируем дефолтное состояние
import { useAuctionViewStore, DEFAULT_AUCTION_STATE } from "@/features/auction/store/auctionViewStore";
import { useCurrencyStore } from "../../model/currencyStore";

type Template = {
  id: string;
  name: string;
  canDelete: boolean;
  settings?: any; 
};

const DEFAULT_TEMPLATE: Template = {
  id: 'default',
  name: 'Настройки по умолчанию',
  canDelete: false,
};

const LOCAL_STORAGE_KEY = 'settings_templates';
const SELECTED_TEMPLATE_ID_KEY = 'selected_template_id';

export const TemplateSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('default');
  const [templates, setTemplates] = useState<Template[]>([DEFAULT_TEMPLATE]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Получаем экшены массового обновления
  const setAuctionBulk = useAuctionViewStore(state => state.setBulkSettings);
  // Предполагаем, что вы добавили такой же метод в currencyStore. Если нет - добавьте.
  const setCurrencyBulk = useCurrencyStore((state: any) => state.setBulkSettings);

  // Геттеры стейта без подписки (для сохранения)
  const getAuctionState = useAuctionViewStore.getState;
  const getCurrencyState = useCurrencyStore.getState;

  useEffect(() => {
    try {
      const savedTemplates = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedTemplates) {
        const parsedTemplates = JSON.parse(savedTemplates);
        if (Array.isArray(parsedTemplates) && parsedTemplates.length > 0) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setTemplates(parsedTemplates);
        }
      }
      const savedSelectedId = localStorage.getItem(SELECTED_TEMPLATE_ID_KEY);
      if (savedSelectedId) setSelectedId(savedSelectedId);
    } catch (error) {
      console.error("Failed to load templates from localStorage:", error);
      setTemplates([DEFAULT_TEMPLATE]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error("Failed to save templates to localStorage:", error);
    }
  }, [templates]);

  const handleCreateTemplate = () => {
    const currentSettings = { 
        ...getAuctionState(), 
        ...getCurrencyState() 
    };

    const newTemplate: Template = {
      id: `tpl_${Date.now()}`,
      name: `Новый шаблон ${templates.length}`,
      canDelete: true,
      settings: currentSettings,
    };
    setTemplates(prev => [...prev, newTemplate]);
    setSelectedId(newTemplate.id);
    setIsOpen(false);
  };

  const handleDeleteTemplate = (e: React.MouseEvent, idToDelete: string) => {
    e.stopPropagation();
    if (confirm('Вы уверены, что хотите удалить этот шаблон?')) {
      setTemplates(prev => prev.filter(t => t.id !== idToDelete));
      if (selectedId === idToDelete) {
        setSelectedId('default'); 
        // При удалении активного шаблона также сбрасываем на дефолт
        setAuctionBulk(DEFAULT_AUCTION_STATE);
        // Если есть дефолтные валюты: setCurrencyBulk(DEFAULT_CURRENCY_STATE);
      }
    }
  };

  const handleSaveTemplate = () => {
    if (selectedId === 'default') {
      alert('Нельзя изменить шаблон по умолчанию. Создайте новый.');
      return;
    }
    const currentSettings = { ...getAuctionState(), ...getCurrencyState() };
    setTemplates(prev =>
      prev.map(t =>
        t.id === selectedId ? { ...t, settings: currentSettings } : t
      )
    );
    alert(`Шаблон "${templates.find(t => t.id === selectedId)?.name}" сохранен!`);
  };

  const handleSelectTemplate = (id: string) => {
    localStorage.setItem(SELECTED_TEMPLATE_ID_KEY, id);
    setSelectedId(id);
    setIsOpen(false);

    const selectedTemplate = templates.find(t => t.id === id);
    
    if (selectedTemplate?.settings) {
      // ✅ Применяем сохраненный шаблон
      setAuctionBulk(selectedTemplate.settings);
      if (setCurrencyBulk) setCurrencyBulk(selectedTemplate.settings);

    } else if (id === 'default') {
        // ✅ ЯВНО применяем дефолтные значения.
        // Это перезаписывает данные в Zustand и обновляет localStorage, 
        // предотвращая баг с возвратом к старым настройкам.
        setAuctionBulk(DEFAULT_AUCTION_STATE);
        
        // ВНИМАНИЕ: Если у вас есть DEFAULT_CURRENCY_STATE, раскомментируйте:
        // if (setCurrencyBulk) setCurrencyBulk(DEFAULT_CURRENCY_STATE);
    }
  };

  const handleStartEditing = (e: React.MouseEvent, template: Template) => {
    e.stopPropagation();
    if (!template.canDelete) return;
    setEditingId(template.id);
    setEditingName(template.name);
  };

  const handleFinishEditing = useCallback(() => {
    if (!editingId) return;
    setTemplates(prev =>
      prev.map(t => (t.id === editingId ? { ...t, name: editingName } : t))
    );
    setEditingId(null);
  }, [editingId, editingName]);

  useEffect(() => {
    if (editingId) {
      inputRef.current?.focus();
    }
  }, [editingId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) handleFinishEditing();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleFinishEditing]);

  const activeTemplate = templates.find(t => t.id === selectedId);

  return (
    <div className="flex items-center gap-2.5 relative z-50" ref={ref}>
      <div className="relative w-[220px]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full bg-[#202024] border border-[#27272a] text-white px-3 h-[34px] rounded-md text-xs cursor-pointer flex items-center justify-between transition-colors hover:border-[#555] ${isOpen ? '!border-[#9147ff]' : ''}`}
        >
          <span className="truncate">{activeTemplate?.name}</span>
          <i className="ph-bold ph-caret-down"></i>
        </button>

        <div className={`absolute top-[calc(100%+6px)] left-0 right-0 bg-[#18181b] border border-[#27272a] rounded-lg shadow-2xl p-1 transition-all duration-200 origin-top ${isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
          {templates.map(tpl => (
            <div
              key={tpl.id}
              className={`px-3 py-2 cursor-pointer rounded flex items-center justify-between text-[#71717a] hover:bg-white/5 hover:text-white text-xs transition-colors group ${selectedId === tpl.id ? 'text-[#9147ff] bg-[#9147ff]/15 font-semibold' : ''}`}
              onClick={() => editingId !== tpl.id && handleSelectTemplate(tpl.id)}
            >
              {editingId === tpl.id ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={handleFinishEditing}
                  onKeyDown={(e) => e.key === 'Enter' && handleFinishEditing()}
                  className="w-full bg-transparent text-white outline-none"
                />
              ) : (
                <span onDoubleClick={(e) => handleStartEditing(e, tpl)}>{tpl.name}</span>
              )}

              {tpl.canDelete && editingId !== tpl.id && (
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10"
                    title="Переименовать"
                    onClick={(e) => handleStartEditing(e, tpl)}
                  >
                    <i className="ph-bold ph-pencil-simple text-xs"></i>
                  </button>
                  <button
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/15 text-red-500"
                    title="Удалить"
                    onClick={(e) => handleDeleteTemplate(e, tpl.id)}
                  >
                    <i className="ph-bold ph-trash text-xs"></i>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        className="w-8 h-8 flex items-center justify-center rounded-md border border-[#27272a] text-[#71717a] hover:text-white hover:bg-[#18181b] hover:border-[#555] transition-all cursor-pointer"
        title="Создать шаблон из текущих настроек"
        onClick={handleCreateTemplate}
      >
        <i className="ph-bold ph-plus"></i>
      </button>

      <button
        className="w-8 h-8 flex items-center justify-center rounded-md border border-[#27272a] text-[#71717a] hover:text-white hover:bg-[#18181b] hover:border-[#555] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        title="Сохранить текущие настройки в выбранный шаблон"
        onClick={handleSaveTemplate}
        disabled={selectedId === 'default'}
      >
        <i className="ph-bold ph-floppy-disk"></i>
      </button>
    </div>
  );
};