import styled from 'react-emotion';
import Slider from '@material-ui/core/Slider';

interface IWrapper {
  half?: Boolean;
}

export const Wrapper = styled('div')<IWrapper>`
  display: inline-flex;
  flex-direction: column;
  position: relative;
  ${(props) => (props.half ? `width: 49.3%` : ``)}
`;

export const SliderWrapper = styled('div')`
  border: 1px solid gray;
  border-radius: 0.5em;
  align-items: center;
  justify-content: center;
  display: flex;
  width: 100%;
  margin-top: 0.15em;
`;

export const SliderBox = styled('div')`
  align-items: center;
  display: flex;
  width: 90%;
  padding: 0.75em 0.5em;
`;

interface ICustomHelperText {
  error?: boolean;
}

export const CustomHelperText = styled('div')<ICustomHelperText>`
  color: ${(props) => (props.error ? 'red' : 'rgba(0, 0, 0, 0.54)')};
  font-size: 13px;
`;

const BoxShadow =
  '0 3px 1px rgba(0,0,0,0.1),0 4px 8px rgba(0,0,0,0.13),0 0 0 1px rgba(0,0,0,0.02)';

export const CustomSlider = styled(Slider)(({ theme }) => ({
  color: '#3F51B5',
  padding: '15px 0',
  '& .MuiSlider-valueLabel': {
    fontSize: 12,
    fontWeight: 'normal',
    top: -4,
    color: 'grey',
  },
  '& .MuiSlider-track': {
    border: 'none',
  },
  '& .MuiSlider-rail': {
    opacity: 0.5,
    backgroundColor: '#bfbfbf',
  },
}));
