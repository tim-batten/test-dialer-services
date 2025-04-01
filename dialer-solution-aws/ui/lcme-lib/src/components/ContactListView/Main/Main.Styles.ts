import styled from 'react-emotion';

export const Wrapper = styled('div')`
  display: grid;
  gap: 15px;
  margin-bottom: 10px;
`;
export const TextWrapper = styled('div')`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
`;

export const CheckBoxGroupWrapper = styled('div')`
  display: grid;
`;
export const CheckBoxLabel = styled('div')`
  font-weight: 400;
`;

export const CheckBoxWrapper = styled('div')({
  '&&': {
    '& .MuiFormControlLabel-labelPlacementStart': {
      marginLeft: 0,
      marginRight: 0,
    },
  },
  display: 'flex',
});
