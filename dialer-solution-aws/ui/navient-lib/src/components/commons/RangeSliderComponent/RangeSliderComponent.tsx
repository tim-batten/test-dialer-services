/* eslint-disable no-unused-vars */
import { TextFieldProps } from 'formik-material-ui';
import React, { useEffect } from 'react';
import {
  CustomHelperText,
  CustomSlider,
  SliderBox,
  SliderWrapper,
  Wrapper,
} from './RangeSliderComponent.Styles';

type TRangeSlider = TextFieldProps & {
  initialValues?: [number, number];
  range: [number, number];
  name: string;
  label: string;
  half?: Boolean;
};

export const RangeSliderComponent: React.FunctionComponent<TRangeSlider> = (
  props,
) => {
  const [value, setValue] = React.useState([1, 25]);

  useEffect(() => {
    setValue(
      props.field.value[1] <= props.range[1] &&
        props.field.value[0] >= props.range[0]
        ? props.field.value
        : [props.range[0], props.range[1]],
    );
  }, [props.field.value]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleCommittedChange = (event, newValue) => {
    props.form.setFieldValue(props.field.name, newValue);
  };

  return (
    <Wrapper half={props.half}>
      <CustomHelperText>{props.label}</CustomHelperText>
      <SliderWrapper>
        <SliderBox>
          <CustomSlider
            value={value}
            min={props.range[0]}
            max={props.range[1]}
            onChange={handleChange}
            onChangeCommitted={handleCommittedChange}
            // getAriaLabel={1}
            valueLabelDisplay='on'
          />
        </SliderBox>
      </SliderWrapper>
    </Wrapper>
  );
};

RangeSliderComponent.defaultProps = {};
