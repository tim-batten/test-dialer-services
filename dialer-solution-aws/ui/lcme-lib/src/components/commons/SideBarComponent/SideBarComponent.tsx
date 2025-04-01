/* eslint-disable no-unused-vars */
import { IconButton, Tooltip } from '@material-ui/core';
import { ClearAll, Flip, Cancel } from '@material-ui/icons';
import React, { ReactNode, useState, useEffect } from 'react';
import {
  ButtonWrapper,
  ContentWrapper,
  InnerContent,
  OuterContent,
  Wrapper,
} from './SideBarComponent.Styles';

interface ISideBarComponent {
  title?: string;
  open?: boolean;
  readonly?: boolean;
  component?: ReactNode;
  /** The total height(px) of the component above the sidebar */
  topOffSet?: number;
  onClose?: () => void;
}

export const SideBarComponent: React.FunctionComponent<ISideBarComponent> = ({
  children,
  open,
  readonly,
  component,
  topOffSet,
  onClose,
}) => {
  const [sSize, setSize] = useState('medium');
  const [sFloat, setFloat] = useState(false);

  useEffect(() => {
    if (!open) {
      onClose && onClose();
    }
  }, [open]);

  const handleSize = () => {
    setSize(sSize === 'medium' ? 'large' : 'medium');
  };

  const handleFloat = () => {
    setFloat(!sFloat);
  };

  return (
    <Wrapper topOffSet={topOffSet}>
      <OuterContent>{children}</OuterContent>
      <InnerContent open={open} size={sSize as any} floating={sFloat}>
        <ContentWrapper disable={!!readonly}>{component}</ContentWrapper>
        <ButtonWrapper disable={!open}>
          <Tooltip title={sSize === 'medium' ? 'Expand' : 'Contract'}>
            <IconButton size='small' onClick={handleSize}>
              <ClearAll />
            </IconButton>
          </Tooltip>

          <Tooltip title={sFloat === true ? 'Relative' : 'Fixed'}>
            <IconButton size='small' onClick={handleFloat}>
              <Flip />
            </IconButton>
          </Tooltip>
        </ButtonWrapper>
      </InnerContent>
    </Wrapper>
  );
};

SideBarComponent.defaultProps = {
  open: false,
};
