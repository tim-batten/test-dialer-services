/* eslint-disable no-unused-vars */
import { MenuItem, Button } from '@material-ui/core';
import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from 'react';
import { DuoColumnSelector } from '../../../../../commons/DuoColumnSelector';
import { TopLabeledTextField } from '../../../../../commons/TopLabeledTextField';
import { IBasicConfig } from '../../../../../commons/types/schedulerTypes';
import { CustomHelperText } from '../../Sequence.Styles';
import { TextWrapper, Wrapper } from './BasicConfig.Styles';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { ContactFlowInfo } from '../../../../../../types/connect-contact-flow';
import { ICampaign } from '../../../../../commons/types/campaignTypes';
import { IDialerDefaults } from '../../../../../commons/types/globalTypes';

interface IBasicsConfig {
  campaigns?: ICampaign[];
  campaign?: ICampaign;
  dialerDefaults?: IDialerDefaults;
  contactFlows?: ContactFlowInfo[];
  handleBasicConfigHandlers: (
    type: 'liveParty' | 'answeringMachine',
    isContactFlow: boolean,
  ) => void;
}

const basicConfig = (props: IBasicsConfig, ref: any) => {
  const [livePartyHandler, setLivePartyHandler] = useState('none');
  const [livePartyContactFlow, setLivePartyContactFlow] = useState('none');
  const [answeringMachineHandler, setAnsweringMachineHandler] =
    useState('none');
  const [answeringMachineContactFlow, setAnsweringMachineContactFlow] =
    useState('none');
  const [phones, setPhones] = useState<string[]>([]);

  const [phonesTouched, setPhonesTouched] = useState(false);
  const [livePartyHandlerTouched, setLivePartyHandlerTouched] = useState(false);
  const [livePartyContactFlowTouched, setLivePartyContactFlowTouched] =
    useState(false);
  const [answeringMachineHandlerTouched, setAnsweringMachineHandlerTouched] =
    useState(false);
  const [
    answeringMachineContactFlowTouched,
    setAnsweringMachineContactFlowTouched,
  ] = useState(false);
  const [validatedContactFlows, setValidatedContactFlows] = useState<ContactFlowInfo[]>([]);

  const [phoneTypes, setPhoneTypes] = useState([] as string[]);
  const [openLiveAlert, setOpenLiveAlert] = useState(false);
  const [openAnswerAlert, setOpenAnswerAlert] = useState(false);

  useEffect(() => {
    const campaign = props?.campaign;
    if (campaign?.BaseConfig?.ActivePhoneTypes) {
      setPhones([]);
      setPhoneTypes(campaign?.BaseConfig?.ActivePhoneTypes);
    } else setPhoneTypes([]);

    // if a contact flow, filter out the override in the list of options
    const campaignContactOverride = campaign?.BaseConfig?.ContactFlowOverride;
    const contactFlowToExclude = campaignContactOverride?.length ? campaignContactOverride : props.dialerDefaults?.ContactFlowId;
    if (
      contactFlowToExclude?.length
    ) {
      const validatedContactFlowsTemp =
        props?.contactFlows?.filter(
          (sf) => sf.Id !== contactFlowToExclude
        ) || [];
      setValidatedContactFlows(validatedContactFlowsTemp);
    } 
  }, [props.campaign]);

  useImperativeHandle(ref, () => ({
    getValues: () => {
      setPhonesTouched(true);
      setLivePartyHandlerTouched(true);
      setAnsweringMachineHandlerTouched(true);
      setLivePartyContactFlowTouched(livePartyHandler === 'PASS_TO_CONTACT_FLOW');
      setAnsweringMachineContactFlowTouched(
        answeringMachineHandler === 'PASS_TO_CONTACT_FLOW',
      );
      return {
        livePartyHandler,
        livePartyContactFlow,
        answeringMachineHandler,
        answeringMachineContactFlow,
        phones,
      };
    },
    reSet: () => {
      setPhonesTouched(false);
      setLivePartyHandlerTouched(false);
      setLivePartyContactFlowTouched(false);
      setAnsweringMachineHandlerTouched(false);
      setAnsweringMachineContactFlowTouched(false);

      setLivePartyHandler('none');
      setLivePartyContactFlow('none');
      setAnsweringMachineHandler('none');
      setAnsweringMachineContactFlow('none');
      setPhones([]);
    },
    setData: (data: IBasicConfig) => {
      setLivePartyHandler(data.livePartyHandler);
      setLivePartyContactFlow(data.livePartyContactFlow);
      setAnsweringMachineHandler(data.answeringMachineHandler);
      setAnsweringMachineContactFlow(data.answeringMachineContactFlow);
      setPhones(data.phones);
    },
  }));

  const livePartyContactFlowComponent = (
    <TopLabeledTextField
      name='livePartyContactFlow'
      label='Live Party Contact Flow'
      select
      fullWidth
      value={livePartyContactFlow}
      onChange={(e) => setLivePartyContactFlow(e.target.value)}
      onBlur={() => setLivePartyContactFlowTouched(true)}
      error={livePartyContactFlow === 'none' && livePartyContactFlowTouched}
      helperText={
        livePartyContactFlow === 'none' &&
        livePartyContactFlowTouched &&
        'This Field is Required'
      }
    >
      <MenuItem value='none' disabled>
        Please Select
      </MenuItem>
      {validatedContactFlows.length > 0 ? (
        validatedContactFlows.map(({ Id, Name }) => {
          return (
            <MenuItem key={Id} value={Id}>
              {Name !== null && Name !== undefined ? Name + ' - ' : null} {Id}
            </MenuItem>
          );
        })
      ) : (
        <MenuItem disabled>Please select a campaign</MenuItem>
      )}
    </TopLabeledTextField>
  );

  const answeringMachineContactFlowComponent = (
    <TopLabeledTextField
      name='answeringMachineContactFlow'
      label='Answering Machine Contact Flow'
      select
      fullWidth
      value={answeringMachineContactFlow}
      onChange={(e) => setAnsweringMachineContactFlow(e.target.value)}
      onBlur={() => setAnsweringMachineContactFlowTouched(true)}
      error={
        answeringMachineContactFlow === 'none' &&
        answeringMachineContactFlowTouched
      }
      helperText={
        answeringMachineContactFlow === 'none' &&
        answeringMachineContactFlowTouched &&
        'This Field is Required'
      }
    >
      <MenuItem value='none' disabled>
        Please Select
      </MenuItem>
      {validatedContactFlows.length > 0
        ? validatedContactFlows.map(({ Id, Name }) => {
            return (
              <MenuItem key={Id} value={Id}>
                {Name !== null && Name !== undefined ? Name + ' - ' : null}{' '}
                {Id}
              </MenuItem>
            );
          })
        : null}
    </TopLabeledTextField>
  );
  const handleAlert = (mode) => {
    if (mode === 'live') {
      setOpenLiveAlert(true);
    }
    if (mode === 'answer') {
      setOpenAnswerAlert(true);
    }
  };

  const handleCloseAlert = (mode) => {
    if (mode === 'live') {
      setOpenLiveAlert(false);
    }
    if (mode === 'answer') {
      setOpenAnswerAlert(false);
    }
  };

  return (
    <Wrapper>
      <TextWrapper>
        <TopLabeledTextField
          name='livePartyHandler'
          label='Live Party Handler'
          select
          fullWidth
          value={livePartyHandler}
          onChange={(e) => {
            setLivePartyHandler(e.target.value);

            if (e.target.value === 'PASS_TO_CONTACT_FLOW')
              props.handleBasicConfigHandlers('liveParty', true);
            else props.handleBasicConfigHandlers('liveParty', false);
          }}
          onBlur={() => setLivePartyHandlerTouched(true)}
          error={livePartyHandler === 'none' && livePartyHandlerTouched}
          helperText={
            livePartyHandler === 'none' &&
            livePartyHandlerTouched &&
            'This Field is Required'
          }
        >
          <MenuItem value='none' disabled>
            Please Select
          </MenuItem>
          <MenuItem value='PASS_TO_AGENT'>Agent</MenuItem>
          <MenuItem onClick={() => handleAlert('live')} value='HANG_UP'>
            Hang Up
          </MenuItem>
          <MenuItem value='PASS_TO_CONTACT_FLOW'>Contact Flow</MenuItem>
        </TopLabeledTextField>

        {livePartyHandler === 'PASS_TO_CONTACT_FLOW'
          ? livePartyContactFlowComponent
          : null}

        <Dialog open={openLiveAlert} onClose={handleCloseAlert}>
          <DialogTitle id='hangUp-warning'>Live Party Warning</DialogTitle>
          <DialogContent>
            <DialogContentText id='hangUp-description'>
              Be warned that selecting Hang Up will Hang Up on the Live Party
              Handler
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleCloseAlert('live')} color='primary'>
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </TextWrapper>
      <TextWrapper>
        <TopLabeledTextField
          name='answeringMachineHandler'
          label='Answering Machine Handler'
          select
          fullWidth
          value={answeringMachineHandler}
          onChange={(e) => {
            setAnsweringMachineHandler(e.target.value);

            if (e.target.value === 'PASS_TO_CONTACT_FLOW')
              props.handleBasicConfigHandlers('answeringMachine', true);
            else props.handleBasicConfigHandlers('answeringMachine', false);
          }}
          onBlur={() => setAnsweringMachineHandlerTouched(true)}
          error={
            answeringMachineHandler === 'none' && answeringMachineHandlerTouched
          }
          helperText={
            answeringMachineHandler === 'none' &&
            answeringMachineHandlerTouched &&
            'This Field is Required'
          }
        >
          <MenuItem value='none' disabled>
            Please Select
          </MenuItem>
          <MenuItem value='PASS_TO_AGENT'>Agent</MenuItem>
          <MenuItem onClick={() => handleAlert('answer')} value='HANG_UP'>
            Hang Up
          </MenuItem>
          <MenuItem value='PASS_TO_CONTACT_FLOW'>Contact Flow</MenuItem>
        </TopLabeledTextField>

        {answeringMachineHandler === 'PASS_TO_CONTACT_FLOW'
          ? answeringMachineContactFlowComponent
          : null}

        <Dialog open={openAnswerAlert} onClose={handleCloseAlert}>
          <DialogTitle id='hangUpAnswer-warning'>
            Answering Machine Warning
          </DialogTitle>
          <DialogContent>
            <DialogContentText id='hangUpAnswer-description'>
              Be warned that selecting Hang Up will Hang Up on the Answering
              Machine Handler
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleCloseAlert('answer')} color='primary'>
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </TextWrapper>
      <>
        <DuoColumnSelector
          name='phones'
          label='Phones'
          itemOptions={phoneTypes}
          dependency={phoneTypes}
          values={phones !== null && phones !== undefined ? phones : []}
          onChange={(e) => {
            setPhones(e);
            setPhonesTouched(true);
          }}
        />
        {phones.length === 0 && phonesTouched && (
          <CustomHelperText error>This Field is Required</CustomHelperText>
        )}
      </>
    </Wrapper>
  );
};

export const BasicConfig = forwardRef(basicConfig);
