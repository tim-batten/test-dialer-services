/* eslint-disable no-empty-pattern */
import { MenuItem, TextField } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { accounts } from '../../../frontend-config';
import { IAccounts } from '../types/commonTypes';

interface IAccountSelector {
  onValueChange: (value: IAccounts | undefined | 'All') => void;
  initialValue?: any;
  fullWidth?: boolean;
  noAll?: boolean;
  disabled?: boolean;
}

export const AccountSelector: React.FunctionComponent<IAccountSelector> = ({
  onValueChange,
  initialValue,
  fullWidth,
  noAll,
  disabled,
}) => {
  const [account, setAccount] = useState<any>(accounts[0].url);
  disabled = disabled || accounts.length === 1;
  const setTitle = (newAccount: string) => {
    const title =
      newAccount === 'All'
        ? 'All Accounts'
        : accounts.find((a) => a.url === newAccount)?.name;
    document.title = `${title} | Dialer Admin UI`;
  };

  useEffect(() => {
    if (initialValue === 'All') {
      setAccount('All');
    } else if (initialValue) {
      setAccount(initialValue.url);
    } else {
      setAccount(accounts[0].url);
    }
    setTitle(initialValue?.url || initialValue);
  }, [initialValue]);

  const handleValueChange = (_account) => {
    setAccount(_account);
    if (_account === 'All') {
      onValueChange('All');
    } else {
      onValueChange(accounts.find((a) => a.url === _account));
    }
    setTitle(_account);
  };

  return (
    <TextField
      select
      value={account}
      onChange={(e) => handleValueChange(e.target.value)}
      variant='outlined'
      size='small'
      fullWidth={fullWidth}
      disabled={disabled}
    >
      {!noAll && (
        <MenuItem key='all' value='All'>
          All
        </MenuItem>
      )}
      {accounts.map((option) => (
        <MenuItem key={option.shortCode} value={option.url}>
          {option.name}
        </MenuItem>
      ))}
    </TextField>
  );
};

AccountSelector.defaultProps = {
  // bla: 'test',
};
