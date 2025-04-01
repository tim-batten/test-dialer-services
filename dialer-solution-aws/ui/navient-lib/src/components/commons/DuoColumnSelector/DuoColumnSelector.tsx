/* eslint-disable no-unused-vars */
import { Divider } from '@material-ui/core';
import { TextFieldProps } from 'formik-material-ui';
import React, { useEffect, useState } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { IOption, isIOption } from '../types/commonTypes';
import { Column } from './components/Column';
import {
  CustomHelperText,
  FieldWrapper,
  Wrapper,
} from './DuoColumnSelector.Styles';

type TDuoColumnSelector = TextFieldProps & {
  itemOptions: (string | IOption)[];
  onChange?: (values: (string | IOption)[]) => void;
  values?: string[];
  dependency?: any;
  doValueChange?: boolean;
};

export const DuoColumnSelector: React.FunctionComponent<TDuoColumnSelector> = (
  props,
) => {
  const [values, setValues] = [
    props.values || props.field.value || [],
    (val: (string | IOption)[]) =>
      props.form.setFieldValue(props.field.name, val),
  ];
  const [options, setOptions] = useState<(string | IOption)[]>(
    props.itemOptions,
  );
  const [, updateState] = React.useState({});
  const forceUpdate = React.useCallback(() => updateState({}), []);
  const fieldTouched = () => props.form.setFieldTouched(props.field.name, true);

  useEffect(() => {
    if (props.doValueChange) {
      setOptions(props.itemOptions);
      setValues([]);
    } else {
      const _values = [...values];
      const _options = [...props.itemOptions];

      _values.forEach((values_) => {
        const op = _options.find((o) =>
          isIOption(o) && isIOption(values_)
            ? o.value === values_.value
            : o === values_,
        );
        const index = _options.indexOf(op as any);
        _options.splice(index, 1);
      });
      setOptions(_options as (string | IOption)[]);
    }
  }, [props.dependency]);

  useEffect(() => {
    const _values = [...values];
    const _options = [...props.itemOptions];

    _values.forEach((values_) => {
      const op = _options.find((o) =>
        isIOption(o) && isIOption(values_)
          ? o.value === values_.value
          : o === values_,
      );

      const index = _options.indexOf(op as any);
      _options.splice(index, 1);
    });
    _options.sort(function (x, z) {
      return options.indexOf(x) - options.indexOf(z);
    });

    setOptions(_options as (string | IOption)[]);
  }, [values]);

  const handleChange = (values: (string | IOption)[]) => {
    props.onChange && props.onChange(values);
  };

  const getEquivalentValue = (
    valOp: (string | IOption)[],
    draggableId: string | IOption,
  ) => {
    const val = isIOption(valOp[0])
      ? valOp.find((item) => (item as IOption).value === draggableId) ||
        draggableId
      : draggableId;

    return val;
  };
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    let val: string | IOption;
    if (!destination) {
      return;
    }
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (destination.droppableId === source.droppableId) {
      let column: (string | IOption)[] = [];
      if (destination.droppableId === 'active') {
        val = getEquivalentValue(values, draggableId);
        column = [...values];
        column.splice(source.index, 1);
        column.splice(destination.index, 0, val);
        setValues(column);
        handleChange(column);
      } else {
        val = getEquivalentValue(options, draggableId);
        column = [...options] as (string | IOption)[];
        column.splice(source.index, 1);
        column.splice(destination.index, 0, val);
        setOptions(column);
      }
    } else if (destination.droppableId !== source.droppableId) {
      const column1: (string | IOption)[] = values;
      const column2: (string | IOption)[] = options;
      if (destination.droppableId === 'active') {
        val = getEquivalentValue(column2, draggableId);
        column2.splice(source.index, 1);
        column1.splice(destination.index, 0, val);
      } else {
        val = getEquivalentValue(column1, draggableId);
        column1.splice(source.index, 1);
        column2.splice(destination.index, 0, val);
      }
      setValues(column1);
      setOptions(column2);
      handleChange(column1);
    }
    fieldTouched();
  };

  const onItemClick = (
    droppableId: string,
    draggableId: string | IOption,
    index: number,
  ) => {
    const column1: (string | IOption)[] = values;
    const column2: (string | IOption)[] = options;
    const val = isIOption(props.itemOptions[0])
      ? props.itemOptions.find(
          (item) => (item as IOption).value === draggableId,
        ) || draggableId
      : draggableId;

    if (droppableId === 'active') {
      column1.splice(index, 1);
      // column2.splice(0, 0, draggableId);
      column2.push(val);
    } else {
      column2.splice(index, 1);
      // column1.splice(0, 0, draggableId);
      column1.push(val);
    }
    setValues(column1);
    setOptions(column2);
    forceUpdate();
    fieldTouched();
    handleChange(column1);
  };

  const willError =
    props.form.touched[props.field.name] &&
    !!props.form.errors[props.field.name];

  const reverseArr = (input) => {
    var ret = new Array();
    for (var i = input.length - 1; i >= 0; i--) {
      ret.push(input[i]);
    }
    return ret;
  };

  const sortArr = (input) => {
    var ret: any = Array.from(input);
    if (isIOption(ret[0])) {
      ret.sort((a: IOption, b: IOption) => {
        if (a.label < b.label) {
          return -1;
        }
        if (a.label > b.label) {
          return 1;
        }
        return 0;
      });
    } else {
      ret.sort((a, b) => {
        if (a < b) {
          return -1;
        }
        if (a > b) {
          return 1;
        }
        return 0;
      });
    }

    return ret;
  };
  return (
    <FieldWrapper className='DuoColumnSelector'>
      <CustomHelperText>{props.label}</CustomHelperText>
      <DragDropContext onDragEnd={onDragEnd}>
        <Wrapper>
          <Column
            items={values}
            columnName='Active'
            columnID='active'
            onItemClick={(droppableId, draggableId, index) =>
              onItemClick(droppableId, draggableId, index)
            }
            onReverse={() => {
              setValues(reverseArr(values));
              handleChange(reverseArr(values));
            }}
            onSort={() => {
              setValues(sortArr(values));
              handleChange(sortArr(values));
            }}
          />
          <Divider orientation='vertical' />
          <Column
            items={options}
            columnName='Inactive'
            columnID='inActive'
            onItemClick={(droppableId, draggableId, index) =>
              onItemClick(droppableId, draggableId, index)
            }
            onReverse={() => setOptions(reverseArr(options))}
            onSort={() => {
              setOptions(sortArr(options));
            }}
          />
        </Wrapper>
      </DragDropContext>
      {willError && (
        <CustomHelperText error={willError}>
          {props.form.errors[props.field.name]}
        </CustomHelperText>
      )}
    </FieldWrapper>
  );
};

DuoColumnSelector.defaultProps = {
  doValueChange: true,
};
