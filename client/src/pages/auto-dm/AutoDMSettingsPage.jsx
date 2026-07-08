import React, { useState } from 'react';
import { CheckCircle2, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAutoDM } from '../../context/AutoDMContext';
import ConnectedPlatformsPanel from '../../components/platforms/ConnectedPlatformsPanel';
import BillingPage from '../BillingPage';

function Field({ label, value }) {
  return (
    <div className="autodm-settings-field">
      <p>{label}</p>
      <strong>{value || 'Not available'}</strong>
    </div>
  );
}

export default function AutoDMSettingsPage() {
  const { user } = useAuth();
  const autoDM = useAutoDM();
  const [activeTab, setActiveTab] = useState('platforms');

  return (
    <div className="autodm-settings-page">
      <header className="autodm-page-title">
        <div>
          <h1>Settings</h1>
          <span>Manage your account and preferences</span>
        </div>
      </header>

      <div className="autodm-settings-tabs">
        {[
          ['platforms', 'Connected Platforms'],
          ['account', 'General'],
          ['billing', 'Billing'],
        ].map(([value, label]) => (
          <button key={value} className={activeTab === value ? 'active' : ''} onClick={() => setActiveTab(value)}>{label}</button>
        ))}
      </div>

      {activeTab === 'platforms' ? <ConnectedPlatformsPanel autoDMState={autoDM} showBillingSummary /> : null}

      {activeTab === 'account' ? (
        <section className="autodm-ref-card">
          <h3>Profile Information</h3>
          <p className="autodm-muted-copy">Update your personal information</p>
          <div className="autodm-account-summary">
            <div>
              {user?.picture ? <img src={user.picture} alt="" /> : <UserRound size={30} />}
            </div>
            <span>
              <strong>{user?.name || 'My Account'}</strong>
              <small>{user?.email}</small>
            </span>
            <em><CheckCircle2 size={15} /> Active workspace</em>
          </div>
          <div className="autodm-settings-grid">
            <Field label="Full name" value={user?.name || 'My Account'} />
            <Field label="Email" value={user?.email} />
            <Field label="Product" value="QuickPost" />
          </div>
        </section>
      ) : null}

      {activeTab === 'billing' ? <BillingPage embedded /> : null}
    </div>
  );
}
