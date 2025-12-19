"use client";

import { useState } from "react";
import { 
  SettingsLayout, 
  GeneralSettings, 
  IntegrationsSettings, 
  AppearanceSettings, 
  ResetModal,
  SettingsTabId 
} from "@/features/settings";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('general');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleFactoryReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <>
      <SettingsLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onHardReset={() => setIsResetModalOpen(true)}
      >
        {activeTab === 'general' && <GeneralSettings />}
        {activeTab === 'integrations' && <IntegrationsSettings />}
        {activeTab === 'appearance' && <AppearanceSettings />}
      </SettingsLayout>

      <ResetModal 
        isOpen={isResetModalOpen} 
        onClose={() => setIsResetModalOpen(false)} 
        onConfirm={handleFactoryReset} 
      />
    </>
  );
}