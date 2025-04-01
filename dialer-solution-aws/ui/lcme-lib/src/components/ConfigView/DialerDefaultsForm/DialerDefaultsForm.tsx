import React from 'react';
import { TextWrapper, Wrapper } from './DialerDefaultsForm.Styles';
import { CustomAutoCompleteField } from '../../commons/CustomAutoCompleteField';
import { CustomTextField } from '../../commons/CustomTextField';
import { MenuItem } from '@material-ui/core';
import { CustomFormikNumberField } from '../../commons/CustomFormikNumberField';
import { CustomNumberFieldInputAdornment } from '../../commons/style/MUI.Styles';
import { RangeSliderComponent } from '../../commons/RangeSliderComponent';
import { IOption } from '../../commons/types/commonTypes';
import { MomentTimeZOnes } from '../../commons/assets/TimeZones';
import { ContactFlowInfo } from '../../../types/connect-contact-flow';

interface IDialerDefaultsForm {
  contactFlows: ContactFlowInfo[];
  formValues: any;
  errors: any;
}

export const DialerDefaultsForm: React.FunctionComponent<
  IDialerDefaultsForm
> = ({ contactFlows, formValues }) => {
  return (
    <Wrapper>
      <TextWrapper>
        <CustomTextField
          name='scheduleTimezone'
          label='Schedule Timezone'
          select
          fullWidth
        >
          <MenuItem value='none' disabled hidden>
            Please Select
          </MenuItem>
          {MomentTimeZOnes.map((tz) => (
            <MenuItem value={tz}>{tz}</MenuItem>
          ))}
        </CustomTextField>
        <CustomAutoCompleteField
          options={
            contactFlows?.map(({ Id, Name }) => ({
              label: `${Name} - ${Id}`,
              value: Id,
            })) || []
          }
          name='contactFlowId'
          label='Default Contact Flow'
          placeholder='Please Select'
          fullWidth
        />
      </TextWrapper>
      <TextWrapper>
        <CustomFormikNumberField
          name='abandonmentIncrementMin'
          label='Abandonment Increment Minumum'
          fullWidth
          min={0}
          InputProps={{
            endAdornment: (
              <CustomNumberFieldInputAdornment position='end'>
                %
              </CustomNumberFieldInputAdornment>
            ),
          }}
        />
        <CustomFormikNumberField
          name='abandonmentIncrementMax'
          label='Abandonment Increment Maximum'
          fullWidth
          min={0}
          InputProps={{
            endAdornment: (
              <CustomNumberFieldInputAdornment position='end'>
                %
              </CustomNumberFieldInputAdornment>
            ),
          }}
        />
      </TextWrapper>
      <TextWrapper>
        <CustomFormikNumberField
          name='cpaModifierMin'
          label='Calls per Agent Modifier Minumum'
          fullWidth
          min={0}
          InputProps={{
            endAdornment: (
              <CustomNumberFieldInputAdornment position='end'>
                %
              </CustomNumberFieldInputAdornment>
            ),
          }}
        />
        <CustomFormikNumberField
          name='cpaModifierMax'
          label='Calls per Agent Modifier Maximum'
          fullWidth
          min={0}
          InputProps={{
            endAdornment: (
              <CustomNumberFieldInputAdornment position='end'>
                %
              </CustomNumberFieldInputAdornment>
            ),
          }}
        />
      </TextWrapper>
      <TextWrapper>
        <CustomFormikNumberField
          name='abaTargetRateMin'
          label='Abandonment Target Rate % Minumum'
          min={0}
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
          name='abaTargetRateMax'
          label='Abandonment Target Rate % Maximum'
          fullWidth
          min={0}
          InputProps={{
            endAdornment: (
              <CustomNumberFieldInputAdornment position='end'>
                %
              </CustomNumberFieldInputAdornment>
            ),
          }}
        />
      </TextWrapper>
      <TextWrapper>
        <CustomFormikNumberField
          name='concurrentCallsMin'
          label='Concurrent Calls Minimum'
          fullWidth
          min={0}
        />
        <CustomFormikNumberField
          name='concurrentCallsMax'
          label='Concurrent Calls Maximum'
          min={1}
          fullWidth
          max={1500}
        />
      </TextWrapper>
      <TextWrapper>
        <CustomFormikNumberField
          name='initialPacingDurationMin'
          label='Initial Pacing Duration Minimum'
          fullWidth
          min={0}
        />
        <CustomFormikNumberField
          name='initialPacingDurationMax'
          label='Initial Pacing Duration Maximum'
          min={0}
          fullWidth
          max={1500}
        />
      </TextWrapper>
      <TextWrapper>
        <CustomFormikNumberField
          name='initialPacingSamplesMin'
          label='Initial Pacing Samples Minimum'
          fullWidth
          min={0}
        />
        <CustomFormikNumberField
          name='initialPacingSamplesMax'
          label='Initial Pacing Samples Maximum'
          min={0}
          fullWidth
          max={1500}
        />
      </TextWrapper>
      <TextWrapper>
        <CustomFormikNumberField
          name='maxCpa'
          label='Max Calls Per Agent'
          min={1}
          max={1500}
          half={true}
        />
      </TextWrapper>
      <TextWrapper>
        <RangeSliderComponent
          range={[0, 100]}
          name='initialCpa'
          label='Initial Calls per Agent Min/Max'
        />
        <RangeSliderComponent
          range={[0, 50]}
          name='scheduleLoops'
          label='Schedule Loops Min/Max'
        />
      </TextWrapper>
      <TextWrapper>
        <RangeSliderComponent
          range={[0, 25]}
          name='callLimitRecord'
          label='Daily Call Limit - Record Min/Max'
        />
        <RangeSliderComponent
          range={[0, 25]}
          name='callLimitPhone'
          label='Daily Call Limit - Phone Min/Max'
        />
      </TextWrapper>
    </Wrapper>
  );
};

DialerDefaultsForm.defaultProps = {};
