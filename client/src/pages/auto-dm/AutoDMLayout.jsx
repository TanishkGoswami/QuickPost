import React from 'react';
import { Outlet } from 'react-router-dom';
import { AutoDMProvider, useAutoDM } from '../../context/AutoDMContext';
import { AlertCircle } from 'lucide-react';

function AutoDMWorkspace() {
  const { hasSocialInstagramConnection, autodmAccounts, activeAccount, setActiveAccount } = useAutoDM();

  return (
    <section className="autodm-shell">
      {!hasSocialInstagramConnection ? (
        <div className="autodm-warning">
          <AlertCircle size={16} />
          Connect Instagram in Social Pilot to sync AutoDM accounts and automations.
        </div>
      ) : null}



      <div className="autodm-content">
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
