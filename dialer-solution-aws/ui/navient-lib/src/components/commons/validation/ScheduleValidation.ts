import { PortraitSharp } from '@material-ui/icons';
import moment from 'moment-timezone';
import * as Yup from 'yup';
import { toBareDate } from '../utils/DateFormatter';
import { IDialerDefaults } from '../types/globalTypes';

// .matches(/^[a-z0-9]+$/i, 'Alphanumeric characters only')

export const schedulerFormValidationSchema = (
  dialerDefaults: IDialerDefaults,
  callingMode: any,
) => {
  return Yup.object().shape({
    scheduleConfigName: Yup.string()
      .min(3, 'Minimum length of 3')
      .max(200, 'Maximum length of 200')
      .matches(/^(?!(none)$)/, 'Required')
      .matches(
        /^[a-zA-Z_-][a-zA-Z0-9 _ -]*$/,
        "Use alphanumeric characters, '_' or '-'. Cannot start with a number",
      )
      .required('Required'),
    timeZone: Yup.string()
      .matches(/^(?!(none)$)/, 'Required')
      .required('Required'),
    startDate: Yup.string()
      .matches(/^(?!(none)$)/, 'Required')
      .required('Required'),
    startTime: Yup.string()
      .matches(/^(?!(none)$)/, 'Required')
      .required('Required'),
    endTime: Yup.string()
      .matches(/^(?!(none)$)/, 'Required')
      .required('Required')
      .test(
        'is-greater',
        'Must be later than the start time.',
        function (value) {
          const { startTime, startDate, endDate } = this.parent;
          const start = toBareDate(new Date(startDate));
          const end = toBareDate(new Date(endDate));

          return (
            moment(value, 'HH:mm').isAfter(moment(startTime, 'HH:mm')) ||
            moment(end).isAfter(moment(start))
          );
        },
      ),
    endDate: Yup.string()
      .matches(/^(?!(none)$)/, 'Required')
      .required('Required')
      .when(
        ['startDate', 'doesEnd', 'recurrence.type'],
        (startDate, ...help: any) => {
          if (help[0] && help[1] !== 'doesNotRepeat') {
            return Yup.date()
              .transform((value, originalValue) => {
                return new Date(originalValue);
              })
              .min(new Date(startDate), 'Must be later than the start date.');
          } else {
            return Yup.string()
              .matches(/^(?!(none)$)/, 'Required')
              .required('Required');
          }
        },
      ),
    recurrence: Yup.object().shape({
      misc: Yup.mixed().when('type', (type) => {
        if (type === 'weekly') {
          return Yup.array().min(1, 'Select a Day');
        } else {
          return Yup.mixed();
        }
      }),
    }),
    campaign: Yup.string()
      .matches(/^(?!(none)$)/, 'Required')
      .required('Required'),

    // concurrentCallsOverride: Yup.number().when(`callingMode`, {
    //   is: 'agentless',
    //   then: Yup.number()
    //     .min(
    //       dialerDefaults?.ConcurrentCallsMin,
    //       `Concurrent Calls Minimum is ${dialerDefaults?.ConcurrentCallsMin}`,
    //     )
    //     .max(
    //       dialerDefaults?.ConcurrentCallsMax,
    //       `Concurrent Calls Maximum is ${dialerDefaults?.ConcurrentCallsMax}`,
    //     )
    //     .required('Required'),
    // }),

    concurrentCallsOverride: Yup.number()
      .test(
        'mode',
        `Concurrent Calls Minimum is ${dialerDefaults?.ConcurrentCallsMin}`,
        (val) => {
          if (callingMode === 'agentless' && typeof val === 'number') {
            return (
              Number(val) >= Number(`${dialerDefaults?.ConcurrentCallsMin}`)
            );
          } else {
            return true;
          }
        },
      )
      .test(
        'mode',
        `Concurrent Calls Maximum is ${dialerDefaults?.ConcurrentCallsMax}`,
        (val) => {
          if (callingMode === 'agentless' && typeof val === 'number') {
            return (
              Number(val) <= Number(`${dialerDefaults?.ConcurrentCallsMax}`)
            );
          } else {
            return true;
          }
        },
      ),

    scheduleLoops: Yup.number()
      .min(
        dialerDefaults?.ScheduleLoopsMin,
        `Schedule Loops Minimum is ${dialerDefaults?.ScheduleLoopsMin}`,
      )
      .max(
        dialerDefaults?.ScheduleLoopsMax,
        `ScheduleLoops Maximum is ${dialerDefaults?.ScheduleLoopsMax}`,
      )
      .required('Required'),
    sequences: Yup.array()
      .of(
        Yup.object().shape({
          basicConfig: Yup.object().shape({
            livePartyContactFlow: Yup.string().when('livePartyHandler', {
              is: (livePartyHandler) =>
                livePartyHandler === 'PASS_TO_CONTACT_FLOW',
              then: Yup.string()
                .min(5, 'Contact Flow must be selected')
                .required('Contact Flow must be selected'),
            }),
            answerMachineContactFlow: Yup.string().when('answerMachineHandler', {
              is: (answerMachineHandler) =>
                answerMachineHandler === 'PASS_TO_CONTACT_FLOW',
              then: Yup.string()
                .min(5, 'Contact Flow must be selected')
                .required('Contact Flow must be selected'),
            }),
          }),
        }),
      )
      .min(1, 'Must have at least 1 Sequence')
      .required('Required'),
  });
};
