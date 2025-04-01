/* eslint-disable no-empty-pattern */
import { Button, MenuItem, TextField } from '@material-ui/core';
import { ArrowLeft, ArrowRight } from '@material-ui/icons';
import React, { useEffect, useState } from 'react';
import { ContentWrapper, Opener, OpenerWrapper, Wrapper } from './ValidationPane.Styles';

interface IValidationPane {
  contactLists: any;
  onContactListChange: (contactList: string) => void;
  onOpenChange: (open: boolean) => void;
  onValidate: () => void;
}

export const ValidationPane: React.FunctionComponent<IValidationPane> = ({ contactLists, onContactListChange, onOpenChange, onValidate }) => {
  const [open, setOpen] = useState(false)
  const [contactList, setContactList] = useState('')

  useEffect(() => {
    setContactList(contactLists?.[0]?.ContactListTable)
  }, [])

  useEffect(() => {
    onContactListChange(contactList)
  }, [contactList])
  useEffect(() => {
    onOpenChange(open)
  }, [open])


  return <Wrapper open={open}>
    <OpenerWrapper open={open}>
      <Opener onClick={() => setOpen(!open)} startIcon={open ? <ArrowRight /> : <ArrowLeft />}>
        {open ? '' : 'Validate'}
      </Opener>
    </OpenerWrapper>
    <ContentWrapper open={open}>
      <TextField
        select
        value={contactList}
        onChange={(e) => setContactList(e.target.value)}
        variant='outlined'
        size='small'
        fullWidth
      >
        {
          contactLists.map((cl, i) =>
            <MenuItem key={i} value={cl.ContactListTable}>
              {cl.ContactListTable}
            </MenuItem>)
        }
      </TextField>
      <Button variant="contained" color="primary" onClick={() => onValidate()} disableElevation>
        Validate
      </Button>
    </ContentWrapper>
  </Wrapper>;
};

ValidationPane.defaultProps = {
  // bla: 'test',
};
