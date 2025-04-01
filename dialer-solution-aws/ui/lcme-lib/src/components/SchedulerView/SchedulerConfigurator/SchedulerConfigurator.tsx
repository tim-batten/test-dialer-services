import {
  Button,
  Step,
  StepContent,
  StepLabel,
  Stepper
} from '@material-ui/core';
import Divider from '@material-ui/core/Divider';
import { Field, Form, Formik } from 'formik';
import moment from 'moment-timezone';
import PubSub from 'pubsub-js';
import React, { useEffect, useState } from 'react';
import { checkSchedule } from '../../../api/Scheduler/Scheduler.API';
import {
  baseURL, config_baseURL,
  set_config_baseURL
} from '../../../api/utils';
import { accounts } from '../../../frontend-config';
import { AccountSelector } from '../../commons/AccountSelector';
import { scheduleInitialValues } from '../../commons/assets/InitialValues';
import { EditableTextField } from '../../commons/EditableTextField';
import { ErrorText, SubName } from '../../commons/style/MUI.Styles';
import { TSeverity } from '../../commons/types/commonTypes';
import {
  ISchedule,
  ModType,
  Occurrence
} from '../../commons/types/schedulerTypes';
import {
  convertTimeZone,
  getConvertedTimeZoneInUTC,
  getDateFromString,
  getRetainTimeZoneInUTC,
  getTimeDuration,
  toStringDate
} from '../../commons/utils/DateFormatter';
import {
  IScheduleEvent,
  rRuleDecode, ScheduleEvents,
  singleOccurrenceDecode
} from '../../commons/utils/RRulesUtils';
import { schedulerFormValidationSchema } from '../../commons/validation/ScheduleValidation';
import { Title } from '../SchedulerMainView/SchedulerMainView.Styles';
import { CampaignSelection } from './CampaignSelection';
import { Schedule } from './Schedule';
import {
  ButtonWrapper,
  ConfigWrapper,
  FormWrapper,
  Wrapper
} from './SchedulerConfigurator.Styles';
import { Sequence } from './Sequence';
import { validateFilter, validateMultipleFilter } from '../../../api';
import { FilterValidationResult } from '../../commons/FilterValidationResult';
import { ContactFlowInfo } from '../../../types/connect-contact-flow';
import { ICampaign } from '../../commons/types/campaignTypes';
import { IDialerDefaults } from '../../commons/types/globalTypes';
import { ScheduleWithOcurrenceInfo } from 'lcme-common/lib/types/schedules-api';

interface ISchedulerConfigurator {
  title?: string;
  onDiscardClick: Function;
  campaigns: ICampaign[];
  contactFlows: ContactFlowInfo[];
  contactFilters: any;
  phoneFilters: any;
  contactSorting: any;
  contactLists: any;
  campaign: any;
  readOnly: boolean;
  getOneCampaign: (campaignID: string) => any;
  updateSchedule: (
    editedScheduleConfig: ISchedule,
    id: string,
    data: string,
    discard: () => void,
    initialScheduleConfig: ISchedule,
  ) => void;
  addSchedule: (schedule: ISchedule, discard: () => void) => void;
  onDelete: (data_id: string, date: string, discard: () => void) => void;
  onAlert: (message: string, severity: TSeverity) => void;
  dialerDefaults: IDialerDefaults;
  creating: boolean;
  selectedSched: any;
  setSelectedSched: (any) => void;
  schedules: ISchedule[];
  scheduleEvents: any;
  schedulesBetweenTimes: ScheduleWithOcurrenceInfo[];
  modType: ModType;
  calendarTimeZone: string;
  onAccountChange: (url: string) => any;
  getSchedulesBetweenTimes: (
    todayStart: Date,
    todayEnd: Date,
    events?: boolean,
  ) => void;
  skipModal: boolean;
  onCampaignChange: () => void;
}

export const SchedulerConfigurator: React.FunctionComponent<
  ISchedulerConfigurator
> = ({
  onDiscardClick,
  campaigns,
  contactFlows: contactFlows,
  contactFilters,
  phoneFilters,
  contactSorting,
  contactLists,
  campaign,
  readOnly,
  getOneCampaign,
  updateSchedule,
  addSchedule,
  setSelectedSched,
  onDelete,
  onAlert,
  creating,
  selectedSched,
  schedules,
  scheduleEvents,
  modType,
  dialerDefaults,
  calendarTimeZone,
  schedulesBetweenTimes,
  onAccountChange,
  getSchedulesBetweenTimes,
  skipModal,
  onCampaignChange,
}) => {
    const [step] = useState(0);
    const [openStepOne, setOpenStepOne] = useState(true);
    const [openStepTwo, setOpenStepTwo] = useState(true);
    const [openStepThree, setOpenStepThree] = useState(true);
    const [selectedSchedule, setSelectedSchedule] = useState(selectedSched);
    const [occurrenceDate, setOccurrenceDate] = useState('');
    const [sequenceIsBeingEdited, setSequenceIsBeingEdited] = useState(false);
    const [configAccount, setConfigAccount] = useState<any>();
    const [callingMode, setCallingMode] = useState('none');
    const [notifyCampaignModeChangeEffects, setNotifyCampaignModeChangeEffects] =
      useState(false);
    const [openValidationResult, setOpenValidationResult] = useState(false);
    const [validationResult, setValidationResult] = useState(null);

    const handleModeSelection = (mode: string, formValues: any) => {
      const sequences = formValues?.sequences;
      if (mode === 'agentless' && sequences?.length > 0)
        setNotifyCampaignModeChangeEffects(true);
    };

    const handleCloseAlert = () => setNotifyCampaignModeChangeEffects(false);

    const hasRunToday =
      selectedSchedule &&
      schedulesBetweenTimes.some(
        (schedule) =>
          schedule.lastExecOccurrence ===
          new Date().toISOString().split('T')[0] &&
          selectedSchedule.id === schedule.schedule.id &&
          occurrenceDate &&
          selectedSchedule.Occurrence.Single &&
          new Date(occurrenceDate).toISOString().split('T')[0] ===
          new Date().toISOString().split('T')[0],
      );

    const handleDiscard = (resetForm: Function) => {
      setSequenceIsBeingEdited(false);
      setCallingMode('none');
      resetForm();
      onDiscardClick();
      setSelectedSched(null);
      PubSub.publish('schedule_discard', true);
    };

    const handleSequenceCallback = (isBeingEdited: boolean) => {
      setSequenceIsBeingEdited(isBeingEdited);
    };

    const handleSubmit = (submitForm: Function) => {
      submitForm();
    };

    const checkScheduleName = (formValues) => {
      let lowerCheck = formValues.scheduleConfigName.toLowerCase();
      let scheduleCheck = schedules.filter((sched) => {
        return sched.ScheduleName.toLowerCase() === lowerCheck;
      });
      return (
        scheduleCheck.length === 0 ||
        (scheduleCheck.length > 0 &&
          !creating &&
          formValues.scheduleConfigName === selectedSchedule?.ScheduleName)
      );
    };
    useEffect(() => {
      setSelectedSchedule(selectedSched);
      if (selectedSched && selectedSched.prjacc) {
        setConfigAccount(
          accounts.find((a) => a.url === selectedSched.prjacc.url),
        );
        set_config_baseURL(selectedSched.prjacc.url);
        onAccountChange(selectedSched.prjacc.url);
      } else if (selectedSched && JSON.stringify(selectedSched) !== '{}') {
        setConfigAccount(accounts.find((a) => a.url === baseURL()));
        onAccountChange(baseURL());
        set_config_baseURL(baseURL());
      } else {
        setConfigAccount(accounts.find((a) => a.url === config_baseURL()));
        onAccountChange(config_baseURL());
      }
    }, [selectedSched]);

    const setFormValues = (setValues) => {
      const schedule: Required<ISchedule> = selectedSchedule;

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
        getOneCampaign(schedule.CampaignId).then((data) => {
          setCallingMode(data.value.data.campaign.BaseConfig.CallingMode);
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

        if (schedule.ScheduleTimeZone) {
          const startDateTime = convertTimeZone(
            new Date(`${template.startDate} ${template.startTime}`),
            calendarTimeZone,
            schedule.ScheduleTimeZone,
          );
          const occurrenceDate = getConvertedTimeZoneInUTC(
            new Date(startDateTime),
            schedule.ScheduleTimeZone,
          ).split('T')[0];

          setOccurrenceDate(occurrenceDate);
        } else {
          setOccurrenceDate(template.startDate);
        }

        // getOneCampaign(template.campaign);
        setValues(template);
      }
    };

    const onSend = (data, resetForm) => {
      const currentSchedule: ISchedule = selectedSchedule;

      const schedRule: IScheduleEvent = {
        timeZone: data.timeZone,
        startDate: data.startDate,
        startTime: data.startTime,
        endDate:
          data.recurrence.type === 'doesNotRepeat'
            ? data.startDate
            : data.endDate,
        endTime: data.endTime,
        recurrence: data.recurrence,
        eventName: data.scheduleConfigName,
        isEnabled: data.isEnabled,
        hasOccurrences: data.recurrence.type !== 'doesNotRepeat' ? true : false,
        doesEnd: data.doesEnd,
        isHoliday: data.isHoliday,
        campaignId: data.campaign,
        eventID: '',
      };

      const rule = new ScheduleEvents().conf(
        schedRule,
        dialerDefaults.ScheduleTimezone,
      );

      const startDateTime = new Date(
        getRetainTimeZoneInUTC(
          getDateFromString(
            toStringDate(schedRule.startDate),
            schedRule.startTime,
          ),
          schedRule.timeZone,
          dialerDefaults.ScheduleTimezone,
        ),
      );

      const endDateTime = new Date(
        getRetainTimeZoneInUTC(
          getDateFromString(toStringDate(schedRule.endDate), schedRule.endTime),
          schedRule.timeZone,
          dialerDefaults.ScheduleTimezone,
        ),
      );

      const singleStartDateTime = new Date(
        getConvertedTimeZoneInUTC(
          getDateFromString(
            toStringDate(schedRule.startDate),
            schedRule.startTime,
          ),
          schedRule.timeZone,
        ),
      );

      const singleEndDateTime = new Date(
        getConvertedTimeZoneInUTC(
          getDateFromString(toStringDate(schedRule.endDate), schedRule.endTime),
          schedRule.timeZone,
        ),
      );

      let occurrence: Occurrence = {
        Single: {
          Date: singleStartDateTime.toISOString(),
          Parent: modType === 'occurrence' ? selectedSchedule?.id : '',
        },
        Duration:
          Math.floor(
            (getTimeDuration(singleStartDateTime, singleEndDateTime) as number) /
            60000,
          ) || 0,
      };

      if (schedRule.hasOccurrences && modType === 'series') {
        occurrence = {
          Recurring: {
            DisabledDates:
              currentSchedule?.Occurrence?.Recurring?.DisabledDates || [],
            Exclusions: currentSchedule?.Occurrence?.Recurring?.Exclusions || [],
            RRule: rule?.rRule?.toString() || '',
          },
          Duration: Math.floor((rule.duration as number) / 60000) || 0,
        };
      }
      const schedule: ISchedule = {
        ScheduleName: data.scheduleConfigName,
        Occurrence: occurrence,
        CampaignId: data.campaign,
        // CallingMode: data.campaignMode,
        // ...(data.campaignMode === 'agentless' &&
        //   data.concurrentCallsOverride &&
        //   data.concurrentCallsOverride !== 0 &&
        //   data.concurrentCallsOverride != null &&
        //   data.concurrentCallsOverride !== NaN && {
        //     PacingOverride: {
        //       ConcurrentCalls: data.concurrentCallsOverride,
        //     },
        //   }),
        Loops: data.scheduleLoops,
        ...(callingMode === 'agentless' &&
          data.concurrentCallsOverride &&
          data.concurrentCallsOverride !== 0 &&
          data.concurrentCallsOverride !== null &&
          !Number.isNaN(data.concurrentCallsOverride) && {
          PacingOverride: {
            ConcurrentCalls: data.concurrentCallsOverride,
          },
        }),
        Sequences: data.sequences.map((seq) => ({
          SequenceName: seq.sequenceName,
          BasicConfig: {
            AmDetection: true,
            MachineDetectedBehavior: seq.basicConfig.answeringMachineHandler,
            ConnectBehavior: seq.basicConfig.livePartyHandler,
            MachineDetectedContactFlow:
              seq.basicConfig.answeringMachineContactFlow === 'none'
                ? ''
                : seq.basicConfig.answeringMachineContactFlow,
            DefaultContactFlow:
              seq.basicConfig.livePartyContactFlow === 'none'
                ? ''
                : seq.basicConfig.livePartyContactFlow,
            Phones: seq.basicConfig.phones,
          },
          FilterSort: {
            ClFilters: seq.filteringAndSorting.contactFilters.map((cl) => ({
              FilterID: cl.value,
            })),
            PndFilters: seq.filteringAndSorting.phoneFilters.map((pf) => ({
              FilterID: pf.value,
            })),
            ClSorts: seq.filteringAndSorting.contactSorting.map((cs) => ({
              OrderByID: cs.value,
              OrderByType: 'DESC',
            })),
          },
          ...(callingMode === 'power' &&
            seq.pacing && {
            Pacing: {
              ClearStats: seq.pacing.clearPacing === 'yes',
              ...(seq.pacing.clearPacing === 'yes' && {
                PacingOverride: {
                  InitialCPAMode: seq.pacing.initialCpaMode,
                  InitialCPA: seq.pacing.initialCpa,
                  InitialDuration: seq.pacing.initialDuration,
                  AbaIncrement: seq.pacing.abaIncrement,
                  CpaModifier: seq.pacing.cpaModifier,
                  AbaCalculation: seq.pacing.abaCalculation,
                  AbaTargetRate: seq.pacing.abaTargetRate,
                },
              }),
              ...(seq.pacing.clearPacing === 'no' && {
                PacingOverride: {
                  InitialCPAMode: campaign.Pacing.InitialCPAMode,
                  InitialCPA: campaign.Pacing.InitialCPA,
                  InitialDuration: campaign.Pacing.InitialDuration,
                  AbaIncrement: campaign.Pacing.AbaIncrement,
                  CpaModifier: campaign.Pacing.CpaModifier,
                  AbaCalculation: campaign.Pacing.AbaCalculation,
                  AbaTargetRate: campaign.Pacing.AbaTargetRate,
                },
              }),
            },
          }),
        })),
      };

      if (!creating) {
        updateSchedule(
          schedule,
          selectedSched.id,
          startDateTime.toISOString(),
          () => {
            handleDiscard(resetForm);
          },
          selectedSchedule,
        );
      } else {
        addSchedule(schedule, () => {
          handleDiscard(resetForm);
        });
      }
    };

    const validateFilters = (payload) => {
      setOpenValidationResult(true)
      validateMultipleFilter(payload).then(data => {
        console.log('validationSuccess', data.data)
        setValidationResult({ status: 'success', data: data.data.results } as any);
      }).catch(error => {
        console.log('validationError', error.response.data)
        setValidationResult({ status: 'error', data: error.response.data } as any);
      });
    }
    return (
      <Wrapper>
        <FormWrapper>
          <Formik
            initialValues={scheduleInitialValues(calendarTimeZone)}
            validationSchema={schedulerFormValidationSchema(
              dialerDefaults,
              callingMode,
            )}
            onSubmit={(values, { setSubmitting, resetForm }) => {
              if (checkScheduleName(values)) {
                onSend(values, resetForm);
              } else {
                onAlert(
                  'This Schedule Name is already in use please use a new one',
                  'warning',
                );
              }
              setSubmitting(false);
            }}
          >
            {({
              submitForm,
              isSubmitting,
              resetForm,
              values,
              setFieldValue,
              touched,
              errors,
              setValues,
              registerField,
            }) => (
              <>
                <Form>
                  {useEffect(() => {
                    setTimeout(() => {
                      setFormValues(setValues);
                    }, 400);
                  }, [selectedSchedule, calendarTimeZone])}
                  {useEffect(() => {
                    setFieldValue('timeZone', calendarTimeZone);
                  }, [calendarTimeZone])}

                  <Title variant='h5' gutterBottom>
                    <Field
                      name='scheduleConfigName'
                      label='Schedule'
                      component={EditableTextField}
                    />
                    <SubName variant='body2'>
                      {selectedSchedule && selectedSchedule.id}
                    </SubName>
                  </Title>
                  <ErrorText>
                    {hasRunToday
                      ? 'Schedules that have already run today are uneditable!'
                      : ''}
                  </ErrorText>
                  <Divider />
                  <ConfigWrapper>
                    <AccountSelector
                      initialValue={configAccount}
                      onValueChange={(account) => {
                        if (account && account !== 'All') {
                          setConfigAccount(account);
                          onAccountChange(account.url);
                          set_config_baseURL(account.url);
                        }
                      }}
                      fullWidth
                      noAll
                      disabled={!creating}
                    />
                  </ConfigWrapper>
                  <Divider />
                  <Stepper activeStep={step} orientation='vertical'>
                    <Step active={openStepOne}>
                      <StepLabel
                        onClick={() => {
                          // setStep(0)
                          setOpenStepOne(!openStepOne);
                        }}
                      >
                        Schedule
                      </StepLabel>
                      <StepContent>
                        <Schedule
                          values={values}
                          setFieldValue={setFieldValue}
                          touched={touched}
                          errors={errors}
                        />
                      </StepContent>
                    </Step>
                    <Step active={openStepTwo}>
                      <StepLabel
                        onClick={() => {
                          // setStep(1)
                          setOpenStepTwo(!openStepTwo);
                        }}
                      >
                        Campaign Selection
                      </StepLabel>
                      <StepContent>
                        <CampaignSelection
                          campaign={campaign}
                          campaigns={campaigns}
                          errors={errors}
                          getOneCampaign={getOneCampaign}
                          values={values}
                          setFieldValue={setFieldValue}
                          registerField={registerField}
                          setCallingMode={setCallingMode}
                          callingMode={callingMode}
                        // handleModeSelection={handleModeSelection}
                        />
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
                        <Sequence
                          values={values}
                          dialerDefaults={dialerDefaults}
                          setFieldValue={setFieldValue}
                          touched={touched}
                          errors={errors}
                          campaigns={campaigns}
                          selectedSchedule={selectedSchedule}
                          contactFlows={contactFlows}
                          contactFilters={contactFilters}
                          phoneFilters={phoneFilters}
                          contactLists={contactLists}
                          contactSorting={contactSorting}
                          campaign={campaign}
                          sequenceIsBeingEdited={sequenceIsBeingEdited}
                          handleSequenceCallback={handleSequenceCallback}
                          isBeingEdited={sequenceIsBeingEdited}
                          skipModal={skipModal}
                          onCampaignChange={onCampaignChange}
                          callingMode={callingMode}
                          onMultipleValidation={data => {
                            validateFilters(data)
                          }}
                        />
                      </StepContent>
                    </Step>
                    <Step expanded>
                      <StepContent>
                        <ButtonWrapper>
                          <Button
                            variant='contained'
                            color='primary'
                            disabled={
                              isSubmitting || sequenceIsBeingEdited || readOnly
                            }
                            onClick={() => {
                              if (!hasRunToday || creating) {
                                handleSubmit(submitForm);
                              }
                            }}
                          >
                            {creating === true ? 'Create' : 'Update'}
                          </Button>
                          {!creating && (
                            <Button
                              variant='contained'
                              color='primary'
                              disabled={
                                isSubmitting || sequenceIsBeingEdited || readOnly
                              }
                              onClick={() => {
                                const convertedNow = new Date(
                                  convertTimeZone(
                                    new Date(),
                                    moment.tz.guess(),
                                    dialerDefaults.ScheduleTimezone,
                                  ),
                                );
                                const dateOccurrence = new Date(occurrenceDate);

                                if (
                                  modType === 'occurrence' &&
                                  dateOccurrence > convertedNow &&
                                  dateOccurrence.toDateString() !==
                                  convertedNow.toDateString()
                                ) {
                                  onDelete(
                                    selectedSchedule.id,
                                    occurrenceDate,
                                    () => {
                                      handleDiscard(resetForm);
                                    },
                                  );
                                } else {
                                  checkSchedule(selectedSchedule.id)
                                    .then((data) => {
                                      onDelete(
                                        selectedSchedule.id,
                                        occurrenceDate,
                                        () => {
                                          handleDiscard(resetForm);
                                        },
                                      );
                                    })
                                    .catch((err) => {
                                      onAlert(
                                        'Cannot delete schedule while running!',
                                        'warning',
                                      );
                                    });
                                }
                              }}
                            >
                              Delete
                            </Button>
                          )}
                          <Button
                            variant='contained'
                            color='primary'
                            onClick={() => handleDiscard(resetForm)}
                          >
                            {readOnly ? 'Close' : 'Discard'}
                          </Button>
                        </ButtonWrapper>
                      </StepContent>
                    </Step>
                  </Stepper>
                </Form>
              </>
            )}
          </Formik>
        </FormWrapper>
        <FilterValidationResult
          title='Validate Filter'
          open={openValidationResult}
          onClose={() => {
            setOpenValidationResult(false)
            setValidationResult(null);
          }}
          data={validationResult}
        />
      </Wrapper>
    );
  };

SchedulerConfigurator.defaultProps = {
  // bla: 'test',
  title: 'Create Schedule',
};
