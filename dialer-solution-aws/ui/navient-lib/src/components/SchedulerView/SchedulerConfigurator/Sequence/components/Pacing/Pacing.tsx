/* eslint-disable no-unused-vars */
import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from '@material-ui/core';
import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from 'react';
import {
  IPacingSeq,
  sequencePacingFields,
} from '../../../../../commons/types/schedulerTypes';
import { MenuItem } from '@material-ui/core';
import { TopLabeledTextField } from '../../../../../commons/TopLabeledTextField';
import { CustomNumberFieldInputAdornment } from '../../../../../commons/style/MUI.Styles';
import { TextWrapper, Wrapper } from './Pacing.Styles';
import { CustomNumberField } from '../../../../../commons/CustomNumberField';
import { ICampaign } from '../../../../../commons/types/campaignTypes';

interface IPacing {
  campaigns?: ICampaign[];
  campaign?: any;
  dialerDefaults?: any;
  pacingErrors: {
    InitialCpa: boolean;
    InitialPacingDuration: boolean;
    InitialPacingSamples: boolean;
    AbandonmentIncrement: boolean;
    AbaTargetRate: boolean;
    CpaModifier: boolean;
  };
  helperText: {
    InitialCpa: string;
    InitialPacingDuration: string;
    InitialPacingSamples: string;
    AbandonmentIncrement: string;
    AbaTargetRate: string;
    CpaModifier: string;
  };
  pacingExpanded: boolean;
  selectedSchedule: any;
  isEdit: boolean;
  errorHandler: (field, value: any) => void;
}

const pacing = (props: IPacing, ref: any) => {
  const [clearPacing, setClearPacing] = useState('no');
  const [initialCpaMode, setInitialCpaMode] = useState('none');
  const [initialCpa, setInitialCpa] = useState(0);
  const [initialDuration, setInitialDuration] = useState(0);
  const [abaIncrement, setAbaIncrement] = useState(0);
  const [cpaModifier, setCpaModifier] = useState(0);
  const [abaCalculation, setAbaCalculation] = useState('none');
  const [abaTargetRate, setAbaTargetRate] = useState(0);
  const [initialPacingDurationLabel, setInitialPacingDurationLabel] = useState(
    'Initial Pacing Duration',
  );
  const [initialCpaModeTouched, setInitialCpaModeTouched] = useState(false);
  const [abaCalculationTouched, setAbaCalculationTouched] = useState(false);
  const [pacingType, setPacingType] = useState('InitialPacingDuration');

  useEffect(() => {
    props.errorHandler('InitialCpa', initialCpa);
  }, [initialCpa]);
  useEffect(() => {
    if (initialCpaMode === 'duration') {
      setPacingType('InitialPacingDuration');
    } else {
      setPacingType('InitialPacingSamples');
    }
  }, [initialCpaMode]);

  useEffect(() => {
    props.errorHandler(pacingType, initialDuration);
  }, [initialDuration]);

  useEffect(() => {
    props.errorHandler('AbandonmentIncrement', abaIncrement);
  }, [abaIncrement]);

  useEffect(() => {
    props.errorHandler('AbaTargetRate', abaTargetRate);
  }, [abaTargetRate]);

  useEffect(() => {
    props.errorHandler('CpaModifier', cpaModifier);
  }, [cpaModifier]);

  useEffect(() => {
    if (initialCpaMode === 'duration')
      setInitialPacingDurationLabel('Initial Pacing Duration (min)');
    else if (initialCpaMode === 'samples')
      setInitialPacingDurationLabel('Initial Pacing Sample Size');
    else setInitialPacingDurationLabel('Initial Pacing Duration');
  }, [initialCpaMode]);

  useEffect(() => {
    if (!props.isEdit) {
      if (props.campaign.Pacing) {
        const p = props.campaign.Pacing;

        setInitialCpaMode(p.InitialCPAMode);
        setInitialCpa(p.InitialCPA);
        setInitialDuration(p.InitialDuration);
        setAbaIncrement(p.AbaIncrement);
        setCpaModifier(p.CpaModifier);
        setAbaCalculation(p.AbaCalculation);
        setAbaTargetRate(p.AbaTargetRate);
      } else {
        setClearPacing('no');
        setInitialCpaMode('none');
        setInitialCpa(0);
        setInitialDuration(0);
        setAbaIncrement(0);
        setCpaModifier(0);
        setAbaCalculation('none');
        setAbaTargetRate(0);
      }
    }
  }, [props.campaign, props.pacingExpanded]);

  useImperativeHandle(ref, () => ({
    getValues: () => {
      if (clearPacing === 'yes') {
        setInitialCpaModeTouched(true);
        setAbaCalculationTouched(true);
      }
      return {
        clearPacing,
        initialCpaMode,
        initialCpa,
        initialDuration,
        abaIncrement,
        cpaModifier,
        abaCalculation,
        abaTargetRate,
      };
    },
    reSet: () => {
      setInitialCpaModeTouched(false);
      setAbaCalculationTouched(false);

      setClearPacing('no');
      setInitialCpaMode('none');
      setInitialCpa(0);
      setInitialDuration(0);
      setAbaIncrement(0);
      setCpaModifier(0);
      setAbaCalculation('none');
      setAbaTargetRate(0);
    },
    setData: (data: IPacingSeq) => {
      setClearPacing(data.clearPacing);
      setInitialCpaMode(data.initialCpaMode || 'none');
      setInitialCpa(data.initialCpa || 0);
      setInitialDuration(data.initialDuration || 0);
      setAbaIncrement(data.abaIncrement || 0);
      setCpaModifier(data.cpaModifier || 0);
      setAbaCalculation(data.abaCalculation || 'none');
      setAbaTargetRate(data.abaTargetRate || 0);
    },
  }));

  return (
    <Wrapper>
      <FormControl component='fieldset'>
        <FormLabel component='legend'>
          Clear Pacing Stats at sequence start
        </FormLabel>
        <RadioGroup
          aria-label='gender'
          name='gender1'
          value={clearPacing}
          onChange={(e) => {
            setClearPacing(e.target.value);
          }}
        >
          <FormControlLabel value='yes' control={<Radio />} label='Yes' />
          <FormControlLabel value='no' control={<Radio />} label='No' />
        </RadioGroup>
      </FormControl>
      {clearPacing === 'yes' && (
        <TextWrapper>
          <CustomNumberField
            name='initialCallsPerAgent'
            label='Initial Call per Agent'
            value={initialCpa}
            onValueChange={(e) => setInitialCpa(e)}
            error={props.pacingErrors?.InitialCpa}
            helperText={
              props.helperText?.InitialCpa !== '' &&
              props.helperText?.InitialCpa
            }
            fullWidth
          />
          <TopLabeledTextField
            name='initialCallsPerAgentMode'
            label='Initial Calls per Agent Mode'
            select
            fullWidth
            value={initialCpaMode}
            onChange={(e) => setInitialCpaMode(e.target.value)}
            onBlur={() => setInitialCpaModeTouched(true)}
            error={initialCpaMode === 'none' && initialCpaModeTouched}
            helperText={
              initialCpaMode === 'none' &&
              initialCpaModeTouched &&
              'This Field is Required'
            }
          >
            <MenuItem value='none' disabled hidden>
              Please Select
            </MenuItem>
            <MenuItem value='duration'>Duration</MenuItem>
            <MenuItem value='samples'>Samples</MenuItem>
          </TopLabeledTextField>
          <CustomNumberField
            name='initialDuration'
            label={initialPacingDurationLabel}
            value={initialDuration}
            onValueChange={(e) => setInitialDuration(e)}
            error={
              pacingType === 'InitialPacingDuration'
                ? props.pacingErrors?.InitialPacingDuration
                : props.pacingErrors?.InitialPacingSamples
            }
            helperText={
              pacingType === 'InitialPacingDuration'
                ? props.helperText?.InitialPacingDuration !== '' &&
                  props.helperText?.InitialPacingDuration
                : props.helperText?.InitialPacingSamples !== '' &&
                  props.helperText?.InitialPacingSamples
            }
            fullWidth
          />
          <CustomNumberField
            name='abaIncrement'
            label='ABA Increment'
            isFloat={true}
            value={abaIncrement}
            onValueChange={(e) => setAbaIncrement(e)}
            error={props.pacingErrors?.AbandonmentIncrement}
            helperText={
              props.helperText?.AbandonmentIncrement !== '' &&
              props.helperText?.AbandonmentIncrement
            }
            fullWidth
            InputProps={{
              endAdornment: (
                <CustomNumberFieldInputAdornment position='end'>
                  %
                </CustomNumberFieldInputAdornment>
              ),
            }}
          />
          <CustomNumberField
            name='cpaModifier'
            label='CPA Modifier'
            isFloat={true}
            value={cpaModifier}
            onValueChange={(e) => setCpaModifier(e)}
            error={props.pacingErrors?.CpaModifier}
            helperText={
              props.helperText?.CpaModifier !== '' &&
              props.helperText?.CpaModifier
            }
            fullWidth
            InputProps={{
              endAdornment: (
                <CustomNumberFieldInputAdornment position='end'>
                  %
                </CustomNumberFieldInputAdornment>
              ),
            }}
          />
          <TopLabeledTextField
            name='abaCalculation'
            label='ABA Calculation'
            select
            fullWidth
            value={abaCalculation}
            onChange={(e) => setAbaCalculation(e.target.value)}
            onBlur={() => setAbaCalculationTouched(true)}
            error={abaCalculation === 'none' && abaCalculationTouched}
            helperText={
              abaCalculation === 'none' &&
              abaCalculationTouched &&
              'This Field is Required'
            }
          >
            <MenuItem value='none' disabled hidden>
              Please Select
            </MenuItem>
            <MenuItem value='Calls'>Calls</MenuItem>
            <MenuItem value='Connects'>Connects</MenuItem>
            <MenuItem value='Detects'>Detects</MenuItem>
          </TopLabeledTextField>
          <CustomNumberField
            name='abaTargetRate'
            label='ABA Target Rate'
            value={abaTargetRate}
            onValueChange={(e) => setAbaTargetRate(e)}
            error={props.pacingErrors?.AbaTargetRate}
            helperText={
              props.helperText?.AbaTargetRate !== '' &&
              props.helperText?.AbaTargetRate
            }
            fullWidth
            InputProps={{
              endAdornment: (
                <CustomNumberFieldInputAdornment position='end'>
                  %
                </CustomNumberFieldInputAdornment>
              ),
            }}
          />
        </TextWrapper>
      )}
    </Wrapper>
  );
};

export const Pacing = forwardRef(pacing);
