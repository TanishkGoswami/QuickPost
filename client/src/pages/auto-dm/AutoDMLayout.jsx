import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AutoDMProvider, useAutoDM } from '../../context/AutoDMContext';
import { AlertCircle } from 'lucide-react';

function AutoDMWorkspace() {
  const { hasSocialInstagramConnection } = useAutoDM();
  const location = useLocation();
  const isEditorPage = location.pathname.includes('/automations/new') || (location.pathname.includes('/automations/') && location.pathname.split('/').length > 4);

  return (
    <section className={`autodm-shell ${isEditorPage ? '!p-0 !max-w-none' : ''}`}>
      {!hasSocialInstagramConnection && !isEditorPage ? (
        <div className="autodm-warning">
          <AlertCircle size={16} />
          Connect Instagram in Social Pilot to sync AutoDM accounts and automations.
        </div>
      ) : null}

      <div className="autodm-content h-full">
        <Outlet />
      </div>
    </section>
  );
}

export default function AutoDMLayout() {
  return (
    <AutoDMProvider>
      <AutoDMWorkspace />
    </AutoDMProvider>
  );
}
