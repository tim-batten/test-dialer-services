/* eslint-disable no-empty-pattern */
import React, { useMemo } from 'react';
import { DraggableDialog } from '../DraggableDialog';
import { Wrapper, ContentWrapper, LoadingWrapper, DataWrapper, ErrorWrapper, MessageWrapper, MessageText, MessageContent, AdditionalErrorWrapper, ErrorTitle, SuccessWrapper, RowWrapper, SeeMore } from './FilterValidationResult.Styles';
import { Accordion, AccordionDetails, AccordionSummary, CircularProgress, Divider, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import ReactJson from 'react-json-view'
import { CountdownTimer } from '../CountdownTimer';


interface IFilterValidationResult {
  title: string;
  open: boolean;
  onClose: () => void;
  data: any
}

export const FilterValidationResult: React.FunctionComponent<IFilterValidationResult> = ({ title, open, onClose, data }) => {

  const successData = useMemo(() => data?.status === 'success' ? data.data : null, [data]);
  const errorData = useMemo(() => data?.status === 'error' ? data.data : null, [data]);

  return <Wrapper>
    <DraggableDialog
      open={open}
      title={title}
      onClose={() => onClose()}
      hideBackdrop={false}
      disableBackdropClick
      scroll='paper'
      actions={[
        {
          title: 'Close',
          onClick: () => onClose()
        }
      ]}
    >
      <ContentWrapper>
        {!data ? <LoadingWrapper><CircularProgress /> <span>Request can take up to 10 minutes. Expect result within the next <CountdownTimer seconds={600} /></span></LoadingWrapper> :
          <DataWrapper>
            {
              !successData ?
                <ErrorWrapper>
                  <ErrorTitle>Error!</ErrorTitle>
                  <MessageWrapper>
                    <MessageText>
                      Message:
                    </MessageText>
                    <MessageContent>
                      {errorData?.message || 'Bad Request'}
                    </MessageContent>
                  </MessageWrapper>
                  <Divider />
                  <AdditionalErrorWrapper>
                    <SeeMore>
                      <AccordionSummary
                        expandIcon={<ExpandMore />}
                        aria-controls="panel1a-content"
                        id="panel1a-header"
                      >
                        <MessageContent>More Details</MessageContent>
                      </AccordionSummary>
                      <AccordionDetails>
                        <ReactJson src={errorData} />
                      </AccordionDetails>
                    </SeeMore>
                  </AdditionalErrorWrapper>
                </ErrorWrapper>
                :
                <SuccessWrapper>
                  <RowWrapper>
                    <MessageWrapper>
                      <MessageText>
                        Consumers Total:
                      </MessageText>
                      <MessageContent>
                        {successData.Consumers_total}
                      </MessageContent>
                    </MessageWrapper>
                    <MessageWrapper>
                      <MessageText>
                        Phones Callable Today:
                      </MessageText>
                      <MessageContent>
                        {successData.Phones_Callable_Today}
                      </MessageContent>
                    </MessageWrapper>
                  </RowWrapper>
                  <Divider />
                  <RowWrapper>
                    <MessageWrapper>
                      <MessageText>
                        Phones Callable for Campaign Time:
                      </MessageText>
                      <MessageContent>
                        {successData.Phones_Callable_forCampaignTime}
                      </MessageContent>
                    </MessageWrapper>
                    <MessageWrapper>
                      <MessageText>
                        Phones Total:
                      </MessageText>
                      <MessageContent>
                        {successData.Phones_Total}
                      </MessageContent>
                    </MessageWrapper>
                  </RowWrapper>
                  <Divider />
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Phone Column</TableCell>
                          <TableCell align="right">Phone Total</TableCell>
                          <TableCell align="right">Phones Callable</TableCell>
                          <TableCell align="right">Phones Callable for Campaign Time</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {successData.Phone_Columns.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell component="th" scope="row">
                              {row.Phone_Column}
                            </TableCell>
                            <TableCell align="right">{row.Phone_Total}</TableCell>
                            <TableCell align="right">{row.Phones_Callable}</TableCell>
                            <TableCell align="right">{row.Phones_Callable_forCampaignTime}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </SuccessWrapper>
            }
          </DataWrapper>
        }
      </ContentWrapper>
    </DraggableDialog>
  </Wrapper>;
};

FilterValidationResult.defaultProps = {
  // bla: 'test',
};
