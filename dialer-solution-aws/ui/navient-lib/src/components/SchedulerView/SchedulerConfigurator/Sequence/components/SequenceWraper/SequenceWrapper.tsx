/* eslint-disable no-unused-vars */
import { IconButton } from '@material-ui/core';
import {
  DeleteOutlined,
  EditOutlined,
  FileCopyOutlined,
} from '@material-ui/icons';
import React, { useEffect, useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { AccordionWrapper } from '../../../../../commons/AccordionWrapper';
import { ISequence } from '../../../../../commons/types/schedulerTypes';
import { BasicConfigTable } from './components/BasicConfigTable';
import { FNSTable } from './components/FNSTable';
import { PacingTable } from './components/PacingTable';
import { ControlWrapper, FormWrapper, Wrapper } from './SequenceWraper.Styles';

interface ISequenceWrapper {
  index: number;
  text: any;
  data: ISequence;
  onDelete: (index: number) => void;
  onCopy: (data: ISequence) => void;
  onEdit: (index: number, data: ISequence) => void;
  isBeingEdited: boolean;
  aSequenceIsBeingEdited: [boolean, number | null];
  handleSequenceCallback: (isBeingEdited: boolean) => void;
  values: any;
}

export const SequenceWrapper: React.FunctionComponent<ISequenceWrapper> = ({
  index,
  text,
  data,
  onDelete,
  onCopy,
  onEdit,
  isBeingEdited,
  aSequenceIsBeingEdited,
  handleSequenceCallback,
  values,
}) => {
  return (
    <Draggable draggableId={text} index={index} key={text + index}>
      {(provided) => (
        <Wrapper
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          innerRef={provided.innerRef}
        >
          <AccordionWrapper name={text}>
            <FormWrapper>
              {data.pacing?.clearPacing && (
                <AccordionWrapper name='Pacing'>
                  <PacingTable data={data.pacing} />
                </AccordionWrapper>
              )}
              <AccordionWrapper name='Basic Config'>
                <BasicConfigTable data={data.basicConfig} />
              </AccordionWrapper>

              <AccordionWrapper name='Filtering and Sorting'>
                <FNSTable data={data.filteringAndSorting} />
              </AccordionWrapper>
            </FormWrapper>
          </AccordionWrapper>
          <ControlWrapper>
            <IconButton
              size='small'
              disabled={
                isBeingEdited || typeof aSequenceIsBeingEdited[1] === 'number'
              }
            >
              <EditOutlined
                fontSize='small'
                onClick={() => {
                  handleSequenceCallback(true);
                  onEdit(index, JSON.parse(JSON.stringify(data)));
                }}
              />
            </IconButton>
            <IconButton
              size='small'
              disabled={
                isBeingEdited || typeof aSequenceIsBeingEdited[1] === 'number'
              }
              onClick={() => onDelete(index)}
            >
              <DeleteOutlined fontSize='small' />
            </IconButton>
            <IconButton
              size='small'
              disabled={
                isBeingEdited || typeof aSequenceIsBeingEdited[1] === 'number'
              }
              onClick={() =>
                onCopy({ ...data, sequenceName: `${data.sequenceName} - Copy` })
              }
            >
              <FileCopyOutlined fontSize='small' />
            </IconButton>
          </ControlWrapper>
        </Wrapper>
      )}
    </Draggable>
  );
};

SequenceWrapper.defaultProps = {
  // bla: 'test',
};
