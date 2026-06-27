import React, { useState } from 'react';
import { Check, CheckCircle2, CreditCard, Plus, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAutoDM } from '../../context/AutoDMContext';
import ConnectedPlatformsPanel from '../../components/platforms/ConnectedPlatformsPanel';

const PLAN_LIMITS = {
  free: { automations: 2, dms: 50, accounts: 1, analytics: false, crm: false },
  'social pilot': { automations: 50, dms: 1000, accounts: 5, analytics: true, crm: true },
  pro: { automations: 50, dms: 1000, accounts: 5, analytics: true, crm: true },
  'gap ultimate ecosystem': { automations: 'Unlimited', dms: 'Unlimited', accounts: 'Unlimited', analytics: true, crm: true },
  enterprise: { automations: 'Unlimited', dms: 'Unlimited', accounts: 'Unlimited', analytics: true, crm: true },
};

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
  const planKey = (user?.plan || 'free').toLowerCase();
  const limits = PLAN_LIMITS[planKey] || PLAN_LIMITS.free;

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
            <Field label="Workspace sync" value="Social Pilot linked" />
          </div>
        </section>
      ) : null}

      {activeTab === 'billing' ? (
        <>
          <section className="autodm-ref-card">
            <div className="autodm-billing-head">
              <span><CreditCard size={30} /></span>
              <div>
                <h3>{user?.plan || 'Free'} plan access</h3>
                <p className="autodm-muted-copy">These limits are reflected across AutoDM features and platform access.</p>
              </div>
              <em>{user?.subscription_status || 'active'}</em>
            </div>
            <div className="autodm-settings-grid">
              <Field label="Automations" value={String(limits.automations)} />
              <Field label="DMs/day" value={String(limits.dms)} />
              <Field label="IG accounts" value={String(limits.accounts)} />
              <Field label="Analytics" value={limits.analytics ? 'Included' : 'Not included'} />
            </div>
          </section>

          <section className="autodm-plan-grid">
            {[
              ['Free', '$0/mo', ['2 Automations', '50 DMs/day', '1 Instagram Account']],
              ['Pro', '$29/mo', ['50 Automations', '1,000 DMs/day', 'Analytics & CRM']],
              ['Enterprise', 'Custom', ['Unlimited Automations', 'Unlimited DMs', 'Priority Support']],
            ].map(([name, price, features]) => (
              <div className={name === 'Pro' ? 'featured' : ''} key={name}>
                {name === 'Pro' ? <b>POPULAR</b> : null}
                <h3>{name}</h3>
                <strong>{price}</strong>
                {features.map((feature) => <p key={feature}><Check size={15} /> {feature}</p>)}
                <button className={name === 'Pro' ? 'btn-arc' : 'btn-ghost'}><Plus size={14} /> {name === 'Enterprise' ? 'Contact Sales' : 'Choose Plan'}</button>
              </div>
            ))}
          </section>
        </>
      ) : null}
    </div>
  );
}
