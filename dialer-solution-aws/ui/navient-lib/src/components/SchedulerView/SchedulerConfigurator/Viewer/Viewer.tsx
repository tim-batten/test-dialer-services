/* eslint-disable no-empty-pattern */
import { Paper, Step, StepContent, StepLabel, Stepper, Table, TableBody, TableCell, TableContainer, TableRow } from '@material-ui/core';
import moment from 'moment-timezone';
import React, { useEffect, useState } from 'react';
import { getOneCampaign } from '../../../../api';
import { AccordionWrapper } from '../../../commons';
import { scheduleInitialValues } from '../../../commons/assets/InitialValues';
import { FloatingPaper } from '../../../commons/FloatingPaper';
import { FormSchedule } from '../../../commons/types/schedulerFormTypes';
import { ISchedule } from '../../../commons/types/schedulerTypes';
import { convertFromMTime } from '../../../commons/utils/DateFormatter';
import { to1stCapital } from '../../../commons/utils/JSONUtils';
import { rRuleDecode, singleOccurrenceDecode } from '../../../commons/utils/RRulesUtils';
import { BasicConfigTable } from '../Sequence/components/SequenceWraper/components/BasicConfigTable';
import { FNSTable } from '../Sequence/components/SequenceWraper/components/FNSTable';
import { PacingTable } from '../Sequence/components/SequenceWraper/components/PacingTable';
import { FormWrapper } from '../Sequence/components/SequenceWraper/SequenceWraper.Styles';
import { ContentWrapper, Wrapper } from './Viewer.Styles';

interface IViewer {
  open: boolean;
  onClose: (open: boolean) => void;
  formData: FormSchedule;
  scheduleData: ISchedule;
  calendarTimeZone: string;
  modType: string;
  contactFilters: any;
  contactSorting: any;
  phoneFilters: any;
}

export const Viewer: React.FunctionComponent<IViewer> = ({ open, onClose, scheduleData, calendarTimeZone, modType, contactFilters, contactSorting, phoneFilters }) => {
  const [step] = useState(0);
  // const [viewerData, setViewerData] = useState<FormSchedule | undefined>(undefined);
  const [openStepOne, setOpenStepOne] = useState(true);
  const [openStepTwo, setOpenStepTwo] = useState(true);
  const [openStepThree, setOpenStepThree] = useState(true);
  const [callingMode, setCallingMode] = useState('none');
  const [formData, setFormData] = useState<any>(scheduleInitialValues(calendarTimeZone));

  useEffect(() => {
    const schedule: Required<ISchedule> = scheduleData as Required<ISchedule>;

    if (schedule && Object.keys(schedule).length > 0) {
      let decodedRule: any = {};
      if (schedule.Occurrence.Recurring) {
        const recurring = schedule.Occurrence.Recurring;
        decodedRule = rRuleDecode(
          recurring.RRule,
          schedule.Occurrence.Duration,
          moment.tz.guess(),
          calendarTimeZone,
          schedule.ScheduleTimeZone,
        );
      } else if (schedule.Occurrence.Single) {
        decodedRule = singleOccurrenceDecode(
          schedule.Occurrence.Single.Date,
          schedule.Occurrence.Duration,
          moment.tz.guess(),
          calendarTimeZone,
        );
      }

      getOneCampaign(schedule.CampaignId).then((data: any) => {
        setCallingMode(data.data.campaign.BaseConfig.CallingMode);
      });
      const template = {
        scheduleConfigName: schedule.ScheduleName,
        timeZone: decodedRule.timeZone,
        doesEnd: modType === 'occurrence' ? true : decodedRule.doesEnd,
        startDate: decodedRule.startDate,
        startTime: decodedRule.startTime,
        endTime: decodedRule.endTime,
        endDate: decodedRule.endDate,
        recurrence:
          modType === 'occurrence'
            ? { type: 'doesNotRepeat', value: 1, misc: '' }
            : decodedRule.recurrence,
        campaign: schedule.CampaignId,
        scheduleLoops: schedule.Loops,
        ...(callingMode === 'agentless' &&
          schedule.PacingOverride?.ConcurrentCalls &&
          schedule.PacingOverride?.ConcurrentCalls != null &&
          !Number.isNaN(schedule.PacingOverride?.ConcurrentCalls) && {
          concurrentCallsOverride: schedule.PacingOverride?.ConcurrentCalls,
        }),

        concurrentCallsOverride: schedule.PacingOverride?.ConcurrentCalls,
        sequences: schedule.Sequences.map((seq) => {
          return {
            sequenceName: seq.SequenceName,
            basicConfig: {
              livePartyHandler: seq.BasicConfig.ConnectBehavior,
              livePartyContactFlow: seq.BasicConfig.DefaultContactFlow,
              answeringMachineHandler: seq.BasicConfig.MachineDetectedBehavior,
              answeringMachineContactFlow:
                seq.BasicConfig.MachineDetectedContactFlow,
              phones: seq.BasicConfig.Phones,
            },
            filteringAndSorting: {
              contactFilters:
                seq.FilterSort.ClFilters.reduce((accVal, clf) => {
                  const filterData = contactFilters?.find(
                    (cf) => cf.id === clf.FilterID,
                  );
                  if (filterData) {
                    accVal.push({
                      value: filterData.id,
                      label: filterData.filterName,
                    });
                  }
                  return accVal;
                }, [] as any[]) || [],
              phoneFilters:
                seq?.FilterSort?.PndFilters?.reduce((accVal, pnf) => {
                  const filterData = phoneFilters?.find(
                    (cf) => cf.id === pnf.FilterID,
                  );
                  if (filterData) {
                    accVal.push({
                      value: filterData.id,
                      label: filterData.filterName,
                    });
                  }
                  return accVal;
                }, [] as any[]) || [],
              contactSorting:
                seq?.FilterSort?.ClSorts?.reduce((accVal, cls) => {
                  const filterData = contactSorting?.find(
                    (cf) => cf.id === cls.OrderByID,
                  );
                  if (filterData) {
                    accVal.push({
                      value: filterData.id,
                      label: filterData.filterName,
                    });
                  }
                  return accVal;
                }, [] as any[]) || [],
            },
            ...(seq.Pacing && {
              pacing: {
                clearPacing: seq.Pacing?.ClearStats ? 'yes' : 'no',
                ...(seq.Pacing.PacingOverride && {
                  initialCpaMode: seq.Pacing.PacingOverride.InitialCPAMode,
                  initialCpa: seq.Pacing.PacingOverride.InitialCPA,
                  initialDuration: seq.Pacing.PacingOverride.InitialDuration,
                  abaIncrement: seq.Pacing.PacingOverride.AbaIncrement,
                  cpaModifier: seq.Pacing.PacingOverride.CpaModifier,
                  abaCalculation: seq.Pacing.PacingOverride.AbaCalculation,
                  abaTargetRate: seq.Pacing.PacingOverride.AbaTargetRate,
                }),
              },
            }),
          };
        }),
        isHoliday: false,
        isEnabled: false,
      };
      setFormData(template);
    }
  }, [callingMode, scheduleData, open]);

  const jsonFileDownload = (json_data) => {
    const fileName = "selectedSchedule.json";
    const data = new Blob([JSON.stringify(json_data)], { type: "text/json" });
    const jsonURL = window.URL.createObjectURL(data);
    const link = document.createElement("a");
    document.body.appendChild(link);
    link.href = jsonURL;
    link.setAttribute("download", fileName);
    link.click();
    document.body.removeChild(link);
  };

  return <FloatingPaper
    title={formData?.scheduleConfigName || ''}
    open={open}
    actions={[{
      title: 'Close',
      onClick: () => onClose(false)
    }, {
      title: 'Export',
      onClick: () => jsonFileDownload(scheduleData || {})
    }]}
  >
    <Wrapper>
      <Stepper activeStep={step} orientation='vertical'>
        <Step active={openStepOne}>
          <StepLabel
            onClick={() => {
              setOpenStepOne(!openStepOne);
            }}
          >
            Schedule
          </StepLabel>
          <StepContent>
            <ContentWrapper>
              <TableContainer component={Paper}>
                <Table size="small" aria-label="a dense table">
                  <TableBody>
                    <TableRow>
                      <TableCell component="h2" scope="row">
                        Timezone:
                      </TableCell>
                      <TableCell align="left">{formData.timeZone}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="h2" scope="row">
                        Start Date:
                      </TableCell>
                      <TableCell align="left">{formData.startDate}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="h2" scope="row">
                        Start Time:
                      </TableCell>
                      <TableCell align="left">{convertFromMTime(formData.startTime)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="h2" scope="row">
                        End Time:
                      </TableCell>
                      <TableCell align="left">{convertFromMTime(formData.endTime)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="h2" scope="row">
                        Recurrence Pattern:
                      </TableCell>
                      <TableCell align="left">{formData.recurrence.type === 'doesNotRepeat' ? 'Does Not Repeat' : to1stCapital(formData.recurrence.type)}</TableCell>
                    </TableRow>
                    {formData.recurrence.type !== 'doesNotRepeat' ?
                      <>
                        {
                          formData.recurrence.type === 'weekly' ?
                            <TableRow>
                              <TableCell component="h2" scope="row" colSpan={2}>
                                {formData.recurrence.misc?.toLocaleString()}
                              </TableCell>
                              <TableCell component="h2" scope="row">
                              </TableCell>
                            </TableRow> :
                            formData.recurrence.type === 'monthly' ?
                              <>
                                <TableRow>
                                  <TableCell component="h2" scope="row">
                                    Monthly Pattern:
                                  </TableCell>
                                  <TableCell component="h2" scope="row">
                                    {formData.recurrence.misc.day && !formData.recurrence.misc.dow ? 'Days' : 'nth day of the week'}
                                  </TableCell>
                                </TableRow>
                                {
                                  formData.recurrence.misc.day && !formData.recurrence.misc.dow ?
                                    <TableRow>
                                      <TableCell component="h2" scope="row">
                                        On Day:
                                      </TableCell>
                                      <TableCell component="h2" scope="row">
                                        {formData.recurrence.misc?.day?.toString()}
                                      </TableCell>
                                    </TableRow> :
                                    <>
                                      <TableRow>
                                        <TableCell component="h2" scope="row">
                                          Order:
                                        </TableCell>
                                        <TableCell component="h2" scope="row">
                                          {formData.recurrence.misc?.day}
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell component="h2" scope="row">
                                          Week Day:
                                        </TableCell>
                                        <TableCell component="h2" scope="row">
                                          {formData.recurrence.misc?.dow}
                                        </TableCell>
                                      </TableRow>
                                    </>
                                }
                              </> : ''

                        }

                        <TableRow>
                          <TableCell component="h2" scope="row">
                            Every
                          </TableCell>
                          <TableCell align="left">
                            {`${formData.recurrence.value} `}{formData.recurrence.type === 'daily'
                              ? 'Day(s)'
                              : formData.recurrence.type === 'weekly'
                                ? 'Weeks(s)'
                                : formData.recurrence.type === 'monthly'
                                  ? 'Month(s)'
                                  : null}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="h2" scope="row">
                            Does End?:
                          </TableCell>
                          <TableCell align="left">
                            {formData.doesEnd ? 'Yes' : 'No'}
                          </TableCell>
                        </TableRow>
                        {
                          formData.doesEnd &&
                          <TableRow>
                            <TableCell component="h2" scope="row">
                              End Date:
                            </TableCell>
                            <TableCell align="left">{formData.endDate}</TableCell>
                          </TableRow>
                        }
                      </>
                      : ''
                    }

                  </TableBody>
                </Table>
              </TableContainer>
            </ContentWrapper>
          </StepContent>
        </Step>
        <Step active={openStepTwo}>
          <StepLabel
            onClick={() => {
              setOpenStepTwo(!openStepTwo);
            }}
          >
            Campaign Selection
          </StepLabel>
          <StepContent>
            <ContentWrapper>
              <TableContainer component={Paper}>
                <Table size="small" aria-label="a dense table">
                  <TableBody>
                    <TableRow>
                      <TableCell component="h2" scope="row">
                        Campaign:
                      </TableCell>
                      <TableCell align="left">{formData.campaign}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="h2" scope="row">
                        Schedule Loops:
                      </TableCell>
                      <TableCell align="left">{formData.scheduleLoops}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </ContentWrapper>
          </StepContent>
        </Step>
        <Step active={openStepThree}>
          <StepLabel
            onClick={() => {
              // setStep(2)
              setOpenStepThree(!openStepThree);
            }}
          >
            Sequences
          </StepLabel>
          <StepContent>
            {
              formData.sequences.map((sequence, i) =>
                <AccordionWrapper key={i} name={sequence.sequenceName}>
                  <FormWrapper>
                    {sequence.pacing?.clearPacing && (
                      <AccordionWrapper name='Pacing'>
                        <PacingTable data={sequence.pacing} />
                      </AccordionWrapper>
                    )}
                    <AccordionWrapper name='Basic Config'>
                      <BasicConfigTable data={sequence.basicConfig} />
                    </AccordionWrapper>

                    <AccordionWrapper name='Filtering and Sorting'>
                      <FNSTable data={sequence.filteringAndSorting} />
                    </AccordionWrapper>
                  </FormWrapper>
                </AccordionWrapper>
              )
            }
          </StepContent>
        </Step>
      </Stepper>
    </Wrapper>
  </FloatingPaper >;
};

Viewer.defaultProps = {
  // bla: 'test',
};
