"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { animate } from "framer-motion";
import type { Lot } from "../types";

interface UseLotItemProps {
  lot: Lot;
  onUpdateAmount: (id: number, additionalAmount: number) => void;
  onSetAmount: (id: number, newAmount: number | null) => void;
  onUpdateContent: (id: number, newContent: string) => void;
  onAddLot: () => void;
}

export const useLotItem = ({
  lot,
  onUpdateAmount,
  onSetAmount,
  onUpdateContent,
  onAddLot,
}: UseLotItemProps) => {
  const [additionalAmount, setAdditionalAmount] = useState("");
  const [isContentFocused, setIsContentFocused] = useState(false);
  const [editedAmount, setEditedAmount] = useState(
    lot.isPlaceholder && (lot.amount === 0 || lot.amount === null)
      ? ""
      : lot.amount?.toString() ?? ""
  );
  // Локальное состояние для редактируемого контента
  const [editedContent, setEditedContent] = useState(lot.content);

  const contentInputRef = useRef<HTMLInputElement>(null);
  const addAmountInputRef = useRef<HTMLInputElement>(null);
  const mainAmountInputRef = useRef<HTMLInputElement>(null);

  // Используем ref, чтобы хранить самое свежее значение editedAmount
  const editedAmountRef = useRef(editedAmount);
  useEffect(() => {
    editedAmountRef.current = editedAmount;
  }, [editedAmount]);

  useEffect(() => {
    if (isContentFocused && contentInputRef.current) {
      contentInputRef.current.focus();
    }
  }, [isContentFocused]);

  // --- ИСПРАВЛЕННЫЙ ЭФФЕКТ СИНХРОНИЗАЦИИ ---
  useEffect(() => {
    const from = parseInt(editedAmountRef.current, 10) || 0;
    const to = lot.amount ?? 0;

    // 1. Если лот стал плейсхолдером (например, после "Очистить всё"),
    // мы должны ГАРАНТИРОВАННО очистить инпут, если там остались старые цифры.
    if (lot.isPlaceholder) {
      if (editedAmountRef.current !== "") {
        // Очищаем стейт
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEditedAmount("");
        // Очищаем DOM напрямую для мгновенного отклика (минуя цикл рендера)
        if (mainAmountInputRef.current) mainAmountInputRef.current.value = "";
        // Обновляем реф
        editedAmountRef.current = "";
      }
      return;
    }

    // 2. Если значения равны, ничего не делаем
    if (from === to) {
      return;
    }

    // 3. Запускаем анимацию только для реальных изменений цифр
    const controls = animate(from, to, {
      duration: 0.5,
      onUpdate: (value) => {
        const currentVal = Math.round(value).toString();
        
        // 🔥 ОПТИМИЗАЦИЯ: Пишем прямо в DOM
        if (mainAmountInputRef.current) {
          mainAmountInputRef.current.value = currentVal;
        }
        
        editedAmountRef.current = currentVal; 
      },
      onComplete: () => {
        setEditedAmount(lot.amount?.toString() ?? "");
      }
    });

    return () => controls.stop();
  }, [lot.amount, lot.isPlaceholder]);
  // ------------------------------------------

  useEffect(() => {
    // Обновляем локальный контент, если он изменился в глобальном сторе
    // и поле не находится в фокусе.
    if (!isContentFocused) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditedContent(lot.content);
    }
  }, [lot.content, isContentFocused]);

  const handleAddAmount = useCallback(() => {
    const amountToAdd = parseInt(additionalAmount, 10);
    if (!isNaN(amountToAdd) && amountToAdd !== 0) {
      onUpdateAmount(lot.id, amountToAdd); 
      setAdditionalAmount("");
    }
  }, [additionalAmount, lot.id, onUpdateAmount]);

  const handleAddAmountWithBlur = useCallback(() => {
    handleAddAmount();
    addAmountInputRef.current?.blur();
  }, [handleAddAmount]);

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditedContent(e.target.value);
    },
    []
  );

  const lotContentRef = useRef(lot.content);
  useEffect(() => {
    lotContentRef.current = lot.content;
  }, [lot.content]);

  const handleContentSave = useCallback(() => {
    setIsContentFocused(false);
    const trimmedContent = editedContent.trim();
    if (trimmedContent !== lotContentRef.current) {
      onUpdateContent(lot.id, trimmedContent);
    }
  }, [lot.id, editedContent, onUpdateContent]);

  const handleAmountSave = useCallback(() => {
    const trimmedAmount = editedAmount.trim();
    let newAmount: number | null;

    if (
      trimmedAmount === "" ||
      trimmedAmount === "0" ||
      trimmedAmount === "-"
    ) {
      newAmount = null;
    } else {
      const parsedAmount = parseInt(trimmedAmount, 10); 
      if (isNaN(parsedAmount)) {
        setEditedAmount(lot.amount?.toString() ?? "");
        return;
      }
      newAmount = parsedAmount;
    }

    if (newAmount !== lot.amount) {
      onSetAmount(lot.id, newAmount);
    }
    setEditedAmount(newAmount !== null ? newAmount.toString() : '');
  }, [editedAmount, lot.id, lot.amount, onSetAmount]);

  const handleInputKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        switch (e.currentTarget.name) {
          case "amount-editor":
            onAddLot();
            break;
          case "content-editor":
            onAddLot();
            e.preventDefault();
            break;
          case "amount-adder":
            handleAddAmount();
            break;
        }
      }
    },
    [handleAddAmount, onAddLot]
  );

  const handleContentFocus = useCallback(() => {
    setIsContentFocused(true);
  }, []);

  return {
    additionalAmount,
    setAdditionalAmount,
    editedAmount,
    setEditedAmount,
    editedContent,
    handleAddAmountWithBlur,
    contentInputRef,
    addAmountInputRef,
    mainAmountInputRef,
    handleContentChange,
    handleContentSave,
    handleAmountSave,
    handleInputKeyPress,
    handleContentFocus,
  };
};