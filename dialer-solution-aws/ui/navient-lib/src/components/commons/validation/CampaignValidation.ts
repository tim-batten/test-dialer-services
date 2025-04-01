import { values } from 'lodash';
import * as Yup from 'yup';
import { IDialerDefaults } from '../types/globalTypes';
import { callingModes } from '../types/campaignTypes';
// const phoneRegExp = /^\+(?:[0-9] ?){6,14}[0-9]$/;
// eslint-disable-next-line import/prefer-default-export

export const campaignFormValidationSchema = (dialerDefaults: IDialerDefaults) => {
  return Yup.object().shape({
    campaignConfigName: Yup.string()
      .min(3, 'Minimum length of 3')
      .max(200, 'Maximum length of 200')
      .required('Required'),
    callingMode: Yup.string()
      .required('Required')
      .is([...callingModes]),
    group: Yup.string()
      .matches(/^(?!(none)$)/, 'Required')
      .required('Required'),
    queue: Yup.string()
      .matches(/^(?!(none)$)/, 'Required')
      .required('Required'),
    contactList: Yup.string()
      .matches(/^(?!(none)$)/, 'Required')
      .required('Required'),
    defaultCallerID: Yup.string()
      .matches(/^(?!(none)$)/, 'Required')
      .required('Required'),
    activePhoneFields: Yup.array()
      .min(1, 'Must have at least 1 active items')
      .required('Required'),
    weight: Yup.number()
      .min(1, 'Minimum Priority is 1')
      .max(100, 'Maximum Priority is 100')
      .required('Required'),
    initialCallsPerAgent: Yup.number().when('callingMode', {
      is: (callingMode) => callingMode !== 'agentless',
      then: Yup.number()
        .min(
          dialerDefaults?.InitialCpaMin,
          `Minimum CPA is ${dialerDefaults?.InitialCpaMin}`,
        )
        .max(
          dialerDefaults?.InitialCpaMax,
          `Maximum CPA is ${dialerDefaults?.InitialCpaMax}`,
        )
        .required('Required'),
    }),
    maxPerAgent: Yup.number().when('callingMode', {
      is: (callingMode) => callingMode !== 'agentless',
      then: Yup.number()
        .min(
          dialerDefaults?.InitialCpaMin,
          `Minimum CPA is ${dialerDefaults?.InitialCpaMin}`,
        )
        .max(dialerDefaults?.MaxCPA, `Maximum CPA is ${dialerDefaults?.MaxCPA}`)
        .required('Required'),
    }),
    initialCpaMode: Yup.string().when('callingMode', {
      is: (callingMode) => callingMode !== 'agentless',
      then: Yup.string()
        .matches(/^(?!(none)$)/, 'Required')
        .required('Required'),
    }),
    initialPacing: Yup.number().when('callingMode', {
      is: (callingMode) => callingMode !== 'agentless',
      then: Yup.number()
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
            )
            .required('Required'),
        })
        .when('initialCpaMode', {
          is: 'duration',
          then: Yup.number()
            .required('Required')
            .min(
              dialerDefaults?.InitialPacingDurationMin,
              `Inital Pacing Duration Minimum is ${dialerDefaults?.InitialPacingDurationMin}`,
            )
            .max(
              dialerDefaults?.InitialPacingDurationMax,
              `Inital Pacing Duration Maximum is ${dialerDefaults?.InitialPacingDurationMax}`,
            ),
        }),
    }),

    aBAIncrement: Yup.number().when('callingMode', {
      is: (callingMode) => callingMode !== 'agentless',
      then: Yup.number()
        .min(
          dialerDefaults?.AbandonmentIncrementMin,
          `Minimum Increment is ${dialerDefaults?.AbandonmentIncrementMin}`,
        )
        .max(
          dialerDefaults?.AbandonmentIncrementMax,
          `Maximum Increment is ${dialerDefaults?.AbandonmentIncrementMax}`,
        )
        .required('Required'),
    }),

    cPAModifier: Yup.number().when('callingMode', {
      is: (callingMode) => callingMode !== 'agentless',
      then: Yup.number()
        .min(
          dialerDefaults?.CpaModifierMin,
          `Minimum Modifier is ${dialerDefaults?.CpaModifierMin}`,
        )
        .max(
          dialerDefaults?.CpaModifierMax,
          `Maximum Modifier is ${dialerDefaults?.CpaModifierMax}`,
        )
        .required('Required'),
    }),

    aBACalculation: Yup.string().when('callingMode', {
      is: (callingMode) => callingMode !== 'agentless',
      then: Yup.string()
        .matches(/^(?!(none)$)/, 'Required')
        .required('Required'),
    }),

    aBATargetRate: Yup.number().when('callingMode', {
      is: (callingMode) => callingMode !== 'agentless',
      then: Yup.number()
        .min(
          dialerDefaults?.AbaTargetRateMin,
          `Minimum ABA Target Rate is ${dialerDefaults?.AbaTargetRateMin}`,
        )
        .max(
          dialerDefaults?.AbaTargetRateMax,
          `Maximum ABA Target Rate is ${dialerDefaults?.AbaTargetRateMax}`,
        )
        .required('Required'),
    }),

    concurrentCalls: Yup.number().when('callingMode', {
      is: (callingMode) => callingMode !== 'power',
      then: Yup.number()
        .min(
          dialerDefaults?.ConcurrentCallsMin,
          ` Minimum Concurrent Calls is ${dialerDefaults?.ConcurrentCallsMin}`,
        )
        .max(
          dialerDefaults?.ConcurrentCallsMax,
          `Maximum Concurrent Calls is ${dialerDefaults?.ConcurrentCallsMax}`,
        )
        .required('Required'),
    }),

    customAttributes: Yup.array().optional(),
  });
};
