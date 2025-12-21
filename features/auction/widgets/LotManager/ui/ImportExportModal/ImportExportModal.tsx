import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfilesStore } from '@/features/auction/store/profilesStore';
import { ProfileItem } from './ProfileItem/ProfileItem';
import { X, Upload, Plus } from 'lucide-react';
import styles from './ImportExportModal.module.scss';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose }) => {
  const { profiles, addProfile, importProfile } = useProfilesStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateNew = () => {
    const newName = `Новое сохранение ${profiles.filter(p => !p.isDefault).length + 1}`;
    addProfile(newName);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result === 'string') {
          const importedData = JSON.parse(result);
          // Простая валидация
          if (importedData && Array.isArray(importedData.lots)) {
            const name = importedData.name || file.name.replace(/\.json$/i, '');
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const normalizedLots = importedData.lots.map((lot: any, index: number) => {
              const content = lot.content ?? lot.name ?? '';
              const amount = lot.amount ?? null;
              const isPlaceholder = content.trim() === '' && (amount === 0 || amount === null);
              
              return {
                ...lot,
                id: lot.id ?? (index + 1),
                content,
                amount,
                isPlaceholder
              };
            });

            importProfile({ name, lots: normalizedLots });
          } else {
            alert('Ошибка: Неверный формат файла сохранения.');
          }
        }
      } catch (error) {
        console.error('Error parsing imported file:', error);
        alert('Ошибка: Не удалось прочитать файл. Убедитесь, что это корректный JSON.');
      }
    };
    reader.readAsText(file);
    // Сбрасываем значение input, чтобы можно было загрузить тот же файл снова
    event.target.value = '';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.modalContent}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.header}>
              <h3>Импорт / Экспорт</h3>
              <button onClick={onClose} className={styles.closeButton}>
                <X size={24} />
              </button>
            </div>
            <div className={styles.profileList}>
              {profiles.map(profile => (
                <ProfileItem key={profile.id} profile={profile} />
              ))}
            </div>
            <div className={styles.footer}>
              <button className={styles.footerButton} onClick={handleImportClick}>
                <Upload size={16} /> Импорт из файла
              </button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".json"
                onChange={handleFileChange}
              />
              <button className={styles.footerButtonPrimary} onClick={handleCreateNew}>
                <Plus size={16} /> Создать сохранение
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};