import React from 'react';
import { useAutoDM } from '../../context/AutoDMContext';

export default function AutoDMAccountSwitcher({ className = '' }) {
  const { autodmAccounts, activeAccount, setActiveAccount } = useAutoDM();

  if (!autodmAccounts || autodmAccounts.length <= 1) {
    return null;
  }

  return (
    <div className={`autodm-account-switcher ${className}`}>
      {autodmAccounts.map((account) => {
        const accountUsername = account.username || account.instagram_username;
        const isActive = account.id === activeAccount?.id;
        return (
          <button
            key={account.id}
            type="button"
            className={isActive ? 'is-active' : ''}
            onClick={() => setActiveAccount(account)}
          >
            <span className="autodm-avatar">
              {account.profile_picture_url ? (
                <img src={account.profile_picture_url} alt="" />
              ) : (
                accountUsername?.[0]?.toUpperCase()
              )}
            </span>
            <span>@{accountUsername}</span>
          </button>
        );
      })}
    </div>
  );
}
