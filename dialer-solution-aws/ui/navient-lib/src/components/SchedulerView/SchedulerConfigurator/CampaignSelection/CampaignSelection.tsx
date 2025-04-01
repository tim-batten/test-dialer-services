/* eslint-disable no-empty-pattern */
import React, { useState, useEffect } from 'react';
import { CustomAutoCompleteField } from '../../../commons/CustomAutoCompleteField';
import { CustomFormikNumberField } from '../../../commons/CustomFormikNumberField';
import { CustomTextField } from '../../../commons/CustomTextField';
import { TextWrapper, Wrapper } from './CampaignSelection.Styles';
import { IOption } from '../../../commons/types/commonTypes';
import { MenuItem } from '@material-ui/core';
import { Sequence } from '../../../commons/types/schedulerTypes';
import { ICampaign, IPacing } from '../../../commons/types/campaignTypes';

interface ICampaignSelection {
  campaign: any;
  campaigns: ICampaign[];
  getOneCampaign: (campaignID: string) => any;
  values: any;
  setFieldValue: any;
  registerField: any;
  errors: any;
  setCallingMode: any;
  callingMode: any;
  // handleModeSelection: (mode: string, values: any) => void;
}

export const CampaignSelection: React.FunctionComponent<ICampaignSelection> = ({
  campaign,
  campaigns,
  getOneCampaign,
  values,
  errors,
  setFieldValue,
  registerField,
  setCallingMode,
  callingMode,
  // handleModeSelection,
}) => {
  const [mode, setMode] = useState('');
  const [modeOptions, setModeOptions] = useState([
    {
      label: 'Power',
      value: 'power',
    },
    {
      label: 'Agentless',
      value: 'agentless',
    },
  ]);

  // useEffect(() => {
  //   setMode(values?.campaignMode);
  //   if (mode === 'power') registerField('concurrentCallsOverride', false);
  //   else if (mode === 'agentless')
  //     registerField('concurrentCallsOverride', true);
  // }, [values?.campaignMode]);

  useEffect(() => {
    setMode(mode);
    setCallingMode(mode);
  }, [mode]);

  const defaultPacing = {
    clearPacing: 'no',
    initialCpaMode: 'none',
    initialCpa: 0,
    initialDuration: 0,
    abaIncrement: 0,
    cpaModifier: 0,
    abaCalculation: 'none',
    abaTargetRate: 0,
  };
  return (
    <Wrapper>
      <TextWrapper>
        <CustomAutoCompleteField
          options={
            campaigns?.map(({ id, CampaignName }) => ({
              label: `${CampaignName}`,
              value: id!,
            })) || []
          }
          name='campaign'
          label='Campaign'
          placeholder='Please Select'
          onHandleChange={(value) => {
            const selectedCampaign = value;
            getOneCampaign(selectedCampaign).then((data) => {
              const campaignData = data.value.data.campaign;
              setMode(campaignData.BaseConfig.CallingMode);
              setCallingMode(campaignData.BaseConfig.CallingMode);
              if (value) {
                if (campaignData.BaseConfig.CallingMode === 'power') {
                  const pacing: IPacing = { ...campaignData.Pacing };
                  const sequences: Sequence[] = [...values.sequences].map(
                    (seq) => ({
                      ...seq,
                      pacing: {
                        clearPacing: 'yes',
                        initialCpaMode: pacing.InitialCPAMode,
                        initialCpa: pacing.InitialCPA,
                        initialDuration: pacing.InitialDuration,
                        abaIncrement: pacing.AbaIncrement,
                        cpaModifier: pacing.CpaModifier,
                        abaCalculation: pacing.AbaCalculation,
                        abaTargetRate: pacing.AbaTargetRate,
                      },
                    }),
                  );

                  setFieldValue('sequences', sequences);
                }
              }
            });
          }}
          fullWidth
        />
      </TextWrapper>
      <TextWrapper>
        <CustomFormikNumberField
          name='scheduleLoops'
          label='Schedule Loops'
          min={0}
          fullWidth
        />
      </TextWrapper>
      {/* <TextWrapper>
        <CustomAutoCompleteField
          options={
            modeOptions?.map(({ label, value }) => ({
              label: label,
              value: value,
            })) as IOption[]
          }
          name='campaignMode'
          label='Campaign Mode'
          placeholder='Please Select'
          onHandleChange={(value) => {
            handleModeSelection(value, values);
          }}
          fullWidth
        />
      </TextWrapper> */}
      {callingMode === 'agentless' ? (
        <TextWrapper>
          <CustomFormikNumberField
            name='concurrentCallsOverride'
            label='Concurrent Calls Override'
            min={0}
            fullWidth
            clear
          />
        </TextWrapper>
      ) : null}
    </Wrapper>
  );
};

CampaignSelection.defaultProps = {
  // bla: 'test',
};
