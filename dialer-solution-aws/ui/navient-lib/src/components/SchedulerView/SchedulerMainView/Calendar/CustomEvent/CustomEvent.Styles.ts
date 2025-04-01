import styled from 'react-emotion';
import { Menu } from 'react-contexify';

// export const Wrappe r = styled('div')`
//   display: grid;
// `;

export const MenuWrapper = styled('div')`
  .react-contexify {
    min-width: 150px;
  }
`;

export const EventWrapper = styled('div')`
  display: flex;
  align-items: center;
  p {
    margin: 0;
  }
`;

export const ShortCodeWrapper = styled('span')<{ color: string }>`
  font-weight: bold;
  color: ${(props) => props.color};
`;
