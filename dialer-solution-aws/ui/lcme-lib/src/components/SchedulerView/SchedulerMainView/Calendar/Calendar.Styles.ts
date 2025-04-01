import styled from 'react-emotion';

export const Wrapper = styled('div')`
  display: grid;
`;
export const CalendarWrapper = styled('div')`
  display: flex;
  flex-direction: column;
  & .rbc-calendar {
    gap: 5px;
  }
  & .rbc-calendar .rbc-toolbar {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 5px;
  }
  & .rbc-calendar .rbc-toolbar .rbc-btn-group {
    display: flex;
  }

  & .rbc-calendar .rbc-toolbar .rbc-btn-group button {
    width: 100%;
  }
  .rbc-row-content {
    position: relative;
    z-index: unset;
  }
`;

export const FieldWrapper = styled('div')`
  display: flex;
  align-items: baseline;
  gap: 10px;
`;
