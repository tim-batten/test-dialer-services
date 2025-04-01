import { MenuItem } from '@material-ui/core';
import React, { useState, useEffect } from 'react';
import { CustomFormikNumberField } from '../../../commons/CustomFormikNumberField';
import { CustomTextField } from '../../../commons/CustomTextField';
import { CustomNumberFieldInputAdornment } from '../../../commons/style/MUI.Styles';
import { TextWrapper, Wrapper } from './PacingForm.Styles';

interface IPacingForm {
  isScheduleExecution?: boolean;
  isCampaignConfig?: boolean;
  campaignMode?: any;
  oversightMode?: any;
  formValues: any;
  errors: any;
}

export const PacingForm: React.FunctionComponent<IPacingForm> = ({
  isScheduleExecution,
  isCampaignConfig,
  campaignMode,
  formValues,
  oversightMode,
  errors,
}) => {
  const [initialPacingDurationLabel, setInitialPacingDurationLabel] = useState(
    'Initial Pacing Duration',
  );
  const [modeOversight, setModeOversight] = useState(null);

  useEffect(() => {
    if (formValues.initialCpaMode === 'duration')
      setInitialPacingDurationLabel('Initial Pacing Duration (min)');
    else if (formValues.initialCpaMode === 'samples')
      setInitialPacingDurationLabel('Initial Pacing Sample Size');
    else setInitialPacingDurationLabel('Initial Pacing Duration');
  }, [formValues]);

  useEffect(() => {
    setModeOversight(oversightMode);
  }, [oversightMode]);

  return (
    <Wrapper>
      <TextWrapper>
        {(isCampaignConfig && campaignMode !== 'agentless') ||
        (isScheduleExecution && oversightMode !== 'agentless') ? (
          <>
            <CustomFormikNumberField
              name='initialCallsPerAgent'
              label='Initial Call per Agent'
              fullWidth
            />
            <CustomFormikNumberField
              name='maxPerAgent'
              label='Max Call per Agent'
              fullWidth
            />
            <CustomTextField
              name='initialCpaMode'
              label='Initial Calls Per Agent Mode'
              select
              fullWidth
            >
              <MenuItem value='none' disabled hidden>
                Please Select
              </MenuItem>
              <MenuItem value='duration'>Duration</MenuItem>
              <MenuItem value='samples'>Samples</MenuItem>
            </CustomTextField>
            <CustomFormikNumberField
              name='initialPacing'
              label={initialPacingDurationLabel}
              fullWidth
              min={0}
            />
            <CustomFormikNumberField
              name='aBAIncrement'
              label='ABA Increment'
              fullWidth
              InputProps={{
                endAdornment: (
                  <CustomNumberFieldInputAdornment position='end'>
                    %
                  </CustomNumberFieldInputAdornment>
                ),
              }}
            />
            <CustomFormikNumberField
              name='cPAModifier'
              label='CPA Modifier'
              fullWidth
              InputProps={{
                endAdornment: (
                  <CustomNumberFieldInputAdornment position='end'>
                    %
                  </CustomNumberFieldInputAdornment>
                ),
              }}
            />
            <CustomTextField
              name='aBACalculation'
              label='ABA Calculation'
              select
              fullWidth
            >
              <MenuItem value='none' disabled hidden>
                Please Select
              </MenuItem>
              <MenuItem value='Calls'>Calls</MenuItem>
              <MenuItem value='Connects'>Connects</MenuItem>
              <MenuItem value='Detects'>Detects</MenuItem>
            </CustomTextField>
            <CustomFormikNumberField
              name='aBATargetRate'
              label='ABA Target Rate %'
              fullWidth
              InputProps={{
                endAdornment: (
                  <CustomNumberFieldInputAdornment position='end'>
                    %
                  </CustomNumberFieldInputAdornment>
                ),
              }}
            />{' '}
          </>
        ) : null}
        {((isScheduleExecution === true && oversightMode === 'agentless') ||
          (isCampaignConfig === true && campaignMode === 'agentless')) && (
          <CustomFormikNumberField
            name='concurrentCalls'
            label='Max Concurrent Calls'
            fullWidth
            min={1}
          />
        )}
        {isScheduleExecution === true && (
          <CustomFormikNumberField
            name='weight'
            label='Campaign Priority'
            fullWidth
            min={1}
            max={100}
          />
        )}
      </TextWrapper>
    </Wrapper>
  );
};

PacingForm.defaultProps = {
  // bla: 'test',
};
