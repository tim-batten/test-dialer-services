/* eslint-disable no-unused-vars */
import { IconButton, Tooltip } from '@material-ui/core';
import { ClearAll, Clear } from '@material-ui/icons';
import React, { ReactNode, useState, useEffect } from 'react';
import {
  ButtonWrapper,
  InnerContent,
  InnerContentWrapper,
  InnerContentContainer,
  OuterContent,
  Wrapper,
  InnerTopBar,
  Title,
} from './BottomSlidingPane.Styles';

interface IBottomSlidingPane {
  title?: string;
  open?: boolean;
  readonly?: boolean;
  component?: ReactNode;
  /** The total height(px) of the component above the sidebar */
  topOffSet?: number;
  onClose: () => void;
}

export const BottomSlidingPane: React.FunctionComponent<IBottomSlidingPane> = ({
  title,
  children,
  open: iOpen,
  readonly,
  component,
  topOffSet,
  onClose,
}) => {
  const [sSize, setSize] = useState('medium');
  const [sFloat, setFloat] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(!!iOpen);
    if (!iOpen) {
      onClose && onClose();
    }
  }, [iOpen]);

  const handleSize = () => {
    setSize(sSize === 'medium' ? 'large' : 'medium');
  };

  // const handleFloat = () => {
  //   setFloat(!sFloat);
  // };

  const handleClose = () => {
    setOpen(false);
    onClose && onClose();
  };

  return (
    <Wrapper topOffSet={topOffSet}>
      <OuterContent>{children}</OuterContent>
      <InnerContent
        open={open}
        size={sSize as any}
        floating={sFloat}
        topOffSet={topOffSet}
      >
        <InnerContentWrapper>
          <InnerTopBar>
            <Title>{title}</Title>
            <ButtonWrapper disable={!open}>
              <Tooltip title={sSize === 'medium' ? 'Expand' : 'Contract'}>
                <IconButton size='small' onClick={handleSize}>
                  <ClearAll />
                </IconButton>
              </Tooltip>

              {/* <IconButton size='small' onClick={handleFloat}>
                <Flip />
              </IconButton> */}
              <Tooltip title='Close'>
                <IconButton size='small' onClick={() => onClose && onClose()}>
                  <Clear />
                </IconButton>
              </Tooltip>
            </ButtonWrapper>
          </InnerTopBar>
          <InnerContentContainer
            open={open}
            size={sSize as any}
            floating={sFloat}
            topOffSet={topOffSet}
            disable={!!readonly}
          >
            {component}
          </InnerContentContainer>
        </InnerContentWrapper>
      </InnerContent>
    </Wrapper>
  );
};

BottomSlidingPane.defaultProps = {
  open: false,
};
