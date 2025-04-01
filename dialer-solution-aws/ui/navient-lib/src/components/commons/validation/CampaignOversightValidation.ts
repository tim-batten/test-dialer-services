import { values } from 'lodash';
import moment from 'moment-timezone';
import * as Yup from 'yup';
import { getGlobalConfig } from '../../../api';
import { getDateFromString } from '../utils/DateFormatter';
import { IDialerDefaults } from '../types/globalTypes';
import { OversightStats } from 'navient-common/lib/types/oversight-stats';

// const phoneRegExp = /^\+(?:[0-9] ?){6,14}[0-9]$/;
// eslint-disable-next-line import/prefer-default-export

export const campaignOversightFormValidationSchema = (
  dialerDefaults: IDialerDefaults,
  scheduleExecution: OversightStats,
) => {
  return Yup.object().shape({
    initialCpaMode: Yup.string().matches(/^(?!(none)$)/, 'Required'),

    initialCallsPerAgent: Yup.number()
      .test(
        'mode',
        `Minimum CPA is ${dialerDefaults?.InitialCpaMin}`,
        (val) => {
          if (
            scheduleExecution?.campaignMode === 'power' &&
            typeof val === 'number'
          ) {
            return Number(val) >= Number(`${dialerDefaults?.InitialCpaMin}`);
          } else {
            return true;
          }
        },
      )
      .test(
        'mode',
        `Maximum CPA is  ${dialerDefaults?.InitialCpaMax}`,
        (val) => {
          if (
            scheduleExecution?.campaignMode === 'power' &&
            typeof val === 'number'
          ) {
            return Number(val) <= Number(`${dialerDefaults?.InitialCpaMax}`);
          } else {
            return true;
          }
        },
      ),

    initialPacing: Yup.number()
      .required('Required')
      .when('initialCpaMode', {
        is: 'samples',
        then: Yup.number()
          .min(
            dialerDefaults?.InitialPacingSamplesMin,
            `Inital Pacing Samples Minimum is ${dialerDefaults?.InitialPacingSamplesMin}`,
          )
          .max(
            dialerDefaults?.InitialPacingSamplesMax,
            `Inital Pacing Samples Maximum is ${dialerDefaults?.InitialPacingSamplesMax}`,
          ),
      })
      .when('initialCpaMode', {
        is: 'duration',
        then: Yup.number()
          .min(
            dialerDefaults?.InitialPacingDurationMin,
            `Inital Pacing Duration Minimum is ${dialerDefaults?.InitialPacingDurationMin}`,
          )
          .max(
            dialerDefaults?.InitialPacingDurationMax,
            `Inital Pacing Duration Maximum is ${dialerDefaults?.InitialPacingDurationMax}`,
          ),
      }),
    aBAIncrement: Yup.number()
      .min(
        dialerDefaults?.AbandonmentIncrementMin,
        `Minimum Increment is ${dialerDefaults?.AbandonmentIncrementMin}`,
      )
      .max(
        dialerDefaults?.AbandonmentIncrementMax,
        `Maximum Increment is ${dialerDefaults?.AbandonmentIncrementMax}`,
      )
      .required('Required'),
    cPAModifier: Yup.number()
      .min(
        dialerDefaults?.CpaModifierMin,
        `Minimum Modifier is ${dialerDefaults?.CpaModifierMin}`,
      )
      .max(
        dialerDefaults?.CpaModifierMax,
        `Maximum Modifier is ${dialerDefaults?.CpaModifierMax}`,
      )
      .required('Required'),
    aBACalculation: Yup.string().matches(/^(?!(none)$)/, 'Required'),
    aBATargetRate: Yup.number()
      .test(
        'mode',
        `Minimum ABA Target Rate is ${dialerDefaults?.AbaTargetRateMin}`,
        (val) => {
          if (
            scheduleExecution?.campaignMode === 'power' &&
            typeof val === 'number'
          ) {
            return Number(val) >= Number(`${dialerDefaults?.AbaTargetRateMin}`);
          } else {
            return true;
          }
        },
      )
      .test(
        'mode',
        `Maximum ABA Target Rate is  ${dialerDefaults?.AbaTargetRateMax}`,
        (val) => {
          if (
            scheduleExecution?.campaignMode === 'power' &&
            typeof val === 'number'
          ) {
            return Number(val) <= Number(`${dialerDefaults?.AbaTargetRateMax}`);
          } else {
            return true;
          }
        },
      ),

    concurrentCalls: Yup.number()
      .min(
        dialerDefaults?.ConcurrentCallsMin,
        `Minimum Max Concurrent Calls is ${dialerDefaults?.ConcurrentCallsMin}`,
      )
      .max(
        dialerDefaults?.ConcurrentCallsMax,
        `Maximum Max Concurrent Calls is ${dialerDefaults?.ConcurrentCallsMax}`,
      ),
    weight: Yup.number()
      .min(0, 'Minimum Priority is 0')
      .max(100, 'Maximum Priority is 100')
      .required('Required'),
    endTime: Yup.string()
      .matches(/^(?!(none)$)/, 'Required')
      .required('Required')
      .test(
        'is-greater',
        'Must be later than the current time.',
        function (value: string) {
          const now = new Date();
          const oldEndDate = new Date(scheduleExecution?.endTime || 0);
          const newEndDate = getDateFromString(oldEndDate, value);
          return moment(newEndDate).isAfter(moment(now));
        },
      ),
  });
};
