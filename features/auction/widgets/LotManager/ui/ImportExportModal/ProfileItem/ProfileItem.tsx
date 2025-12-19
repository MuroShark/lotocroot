import React, { useState } from 'react';
import type { Profile } from '@/features/auction/store/profilesStore';
import { useProfilesStore } from '@/features/auction/store/profilesStore';
import { useLotsStore } from '@/entities/lot/model/store/lotsStore';
import { Trash2, Download, Upload, Save, Check } from 'lucide-react';
import styles from '../ImportExportModal.module.scss';

interface ProfileItemProps {
  profile: Profile;
}

export const ProfileItem: React.FC<ProfileItemProps> = ({ profile }) => {
  const { deleteProfile, updateProfileName, saveLotsToProfile } = useProfilesStore();
  const { lots: currentLots, setLots } = useLotsStore();
  const [name, setName] = useState(profile.name);
  const [isJustSaved, setIsJustSaved] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleNameBlur = () => {
    if (name.trim() && name !== profile.name) {
      updateProfileName(profile.id, name.trim());
    } else {
      setName(profile.name); // revert if empty or unchanged
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const handleDelete = () => {
    deleteProfile(profile.id);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify({ name: profile.name, lots: profile.lots }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${profile.name.replace(/\s+/g, '_')}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleLoad = () => {
    setLots(profile.lots.length > 0 ? profile.lots : []);
  };

  const handleSave = () => {
    saveLotsToProfile(profile.id, currentLots);
    setIsJustSaved(true);
    setTimeout(() => setIsJustSaved(false), 2000);
  };

  const lotCount = profile.lots.length;

  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isCurrentYear = date.getFullYear() === now.getFullYear();

    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short', // Используем 'short' для более компактного вида, например "24 мая"
      hour: '2-digit',
      minute: '2-digit',
    };

    if (!isCurrentYear) {
      options.year = 'numeric';
    }
    return date.toLocaleString('ru-RU', options).replace(' г.', ''); // Убираем " г." для чистоты
  };
  const lastUpdated = getFormattedDate(profile.updatedAt);

  return (
    <div className={styles.profileItem}>
      <div className={styles.profileInfo}>
        <input
          type="text"
          value={name}
          onChange={handleNameChange}
          onBlur={handleNameBlur}
          onKeyDown={handleKeyDown}
          className={styles.profileNameInput}
          disabled={profile.isDefault}
        />
        <div className={styles.profileMeta}>
          <span>Лотов: {lotCount}</span>
          <span>Обновлено: {lastUpdated}</span>
        </div>
      </div>
      <div className={styles.profileActions}>
        {!profile.isDefault && (
          <button title="Удалить" onClick={handleDelete} className={styles.actionButton}>
            <Trash2 size={18} />
          </button>
        )}
        <button title="Экспорт в JSON" onClick={handleExport} className={styles.actionButton}>
          <Download size={18} />
        </button>
        <button title="Загрузить" onClick={handleLoad} className={styles.actionButton}>
          <Upload size={18} />
        </button>
        <button title="Сохранить текущие лоты" onClick={handleSave} className={styles.actionButton}>
          {isJustSaved ? <Check size={18} color="var(--green)" /> : <Save size={18} />}
        </button>
      </div>
    </div>
  );
};