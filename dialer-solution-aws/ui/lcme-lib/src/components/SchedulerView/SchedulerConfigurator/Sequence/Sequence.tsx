/* eslint-disable no-unused-vars */
import { Button, Divider } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import PubSub from 'pubsub-js';
import React, { useEffect, useRef, useState } from 'react';
import { DragDropContext, DropResult, Droppable } from 'react-beautiful-dnd';
import { AccordionWrapper } from '../../../commons/AccordionWrapper';
import { TopLabeledTextField } from '../../../commons/TopLabeledTextField';
import {
  IBasicConfig,
  IFilteringNSorting,
  IPacingSeq,
  ISequence,
} from '../../../commons/types/schedulerTypes';
import { convertToHourMin } from '../../../commons/utils/DateFormatter';
import {
  ButtonWrapper,
  CustomHelperText,
  InputWrapper,
  ItemList,
  Wrapper,
} from './Sequence.Styles';
import { BasicConfig } from './components/BasicConfig';
import { FilteringAndSorting } from './components/FilteringAndSorting';
import { Pacing } from './components/Pacing';
import { SequenceWrapper } from './components/SequenceWraper';
import { SnackbarComponent } from '../../../commons';
import { ContactFlowInfo } from '../../../../types/connect-contact-flow';
import { ICampaign } from '../../../commons/types/campaignTypes';
import { IDialerDefaults } from '../../../commons/types/globalTypes';

interface ISequences {
  values: any;
  dialerDefaults: IDialerDefaults;
  setFieldValue: Function;
  touched: any;
  errors: any;
  campaigns?: ICampaign[];
  contactFilters: any;
  phoneFilters: any;
  contactSorting: any;
  contactLists: any;
  campaign: ICampaign;
  contactFlows: ContactFlowInfo[];
  isBeingEdited: any;
  selectedSchedule: any;
  handleSequenceCallback: (isBeingEdited: boolean) => void;
  skipModal: boolean;
  onCampaignChange: () => void;
  callingMode: any;
  sequenceIsBeingEdited: boolean;
  onMultipleValidation: (data: any) => void;
}

export const Sequence: React.FunctionComponent<ISequences> = ({
  values,
  setFieldValue,
  errors,
  touched,
  campaigns,
  contactFilters,
  phoneFilters,
  dialerDefaults,
  contactSorting,
  contactLists,
  campaign,
  contactFlows,
  isBeingEdited,
  handleSequenceCallback,
  skipModal,
  onCampaignChange,
  callingMode,
  selectedSchedule,
  sequenceIsBeingEdited,
  onMultipleValidation,
}) => {
  const [openSnack, setOpenSnack] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [sequences, setSequences] = useState<ISequence[]>(
    values.sequences || [],
  );
  const [sequenceName, setSequenceName] = useState('');
  const [basicConfigExpand, setBasicConfigExpand] = useState(false);
  const [fNSExpand, setFNSExpand] = useState(false);
  const [pacingExpand, setPacingExpand] = useState(false);

  const [sequenceNameTouched, setSequenceNameTouched] = useState(false);
  const [basicConfigError, setBasicConfigError] = useState(false);
  const [fnSError, setFnSError] = useState(false);
  const [pacingError, setPacingError] = useState(false);

  const [editIndex, setEditIdex] = useState<number | null>(null);
  const [, updateState] = React.useState({});
  const forceUpdate = React.useCallback(() => updateState({}), []);

  const basicConfigRef = useRef(undefined);
  const fnsRef = useRef(undefined);
  const pacingRef = useRef(undefined);

  const [livePartyIsContactFlow, setLivePartyIsContactFlow] = useState(false);
  const [answeringMachineIsContactFlow, setAnsweringMachineIsContactFlow] =
    useState(false);
  const [openContactFlowOverrideAlert, setOpenContactFlowOverrideAlert] =
    useState(false);

  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    if (!sequenceIsBeingEdited) {
      setIsEdit(false);
    }
  }, [sequenceIsBeingEdited]);

  useEffect(() => {}, [isEdit]);

  const [pacingErrors, setPacingErrors] = useState({
    InitialCpa: false,
    InitialPacingDuration: false,
    InitialPacingSamples: false,
    AbandonmentIncrement: false,
    AbaTargetRate: false,
    CpaModifier: false,
  });

  const [pacingHelperText, setPacingHelperText] = useState({
    InitialCpa: '',
    InitialPacingDuration: '',
    InitialPacingSamples: '',
    AbandonmentIncrement: '',
    AbaTargetRate: '',
    CpaModifier: '',
  });
  useEffect(() => {}, [sequences]);

  const errorHandler = (field, value: any) => {
    const globals = dialerDefaults;
    const min = globals[`${field}Min`];
    const max = globals[`${field}Max`];

    if (value > max) {
      setPacingErrors({ ...pacingErrors, [`${field}`]: true });
      setHelperText(
        field,
        `${field.replace(/([A-Z])/g, ' $1').trim()} must be less than ${max}`,
      );
    } else if (value < min) {
      setPacingErrors({ ...pacingErrors, [`${field}`]: true });
      setHelperText(
        field,
        `${field
          .replace(/([A-Z])/g, ' $1')
          .trim()} must be greater than ${min}`,
      );
    } else {
      setPacingErrors({ ...pacingErrors, [`${field}`]: false });
      setHelperText(field, '');
    }
  };

  const setHelperText = (field, helperText: string) => {
    if (field === 'InitialCpa') {
      if (helperText === '')
        setPacingHelperText({ ...pacingHelperText, [`${field}`]: '' });
      else if (pacingHelperText.InitialCpa !== helperText)
        setPacingHelperText({ ...pacingHelperText, [`${field}`]: helperText });
    } else if (field === 'InitialPacingDuration') {
      if (helperText === '')
        setPacingHelperText({ ...pacingHelperText, [`${field}`]: '' });
      else if (pacingHelperText.InitialPacingDuration !== helperText)
        setPacingHelperText({ ...pacingHelperText, [`${field}`]: helperText });
    } else if (field === 'InitialPacingSamples') {
      if (helperText === '')
        setPacingHelperText({ ...pacingHelperText, [`${field}`]: '' });
      else if (pacingHelperText.InitialPacingSamples !== helperText)
        setPacingHelperText({ ...pacingHelperText, [`${field}`]: helperText });
    } else if (field === 'CpaModifier') {
      if (helperText === '')
        setPacingHelperText({ ...pacingHelperText, [`${field}`]: '' });
      else if (pacingHelperText.CpaModifier !== helperText)
        setPacingHelperText({ ...pacingHelperText, [`${field}`]: helperText });
    } else if (field === 'AbaTargetRate') {
      if (helperText === '')
        setPacingHelperText({ ...pacingHelperText, [`${field}`]: '' });
      else if (pacingHelperText.AbaTargetRate !== helperText)
        setPacingHelperText({ ...pacingHelperText, [`${field}`]: helperText });
    } else if (field === 'AbandonmentIncrement') {
      if (helperText === '')
        setPacingHelperText({ ...pacingHelperText, [`${field}`]: '' });
      else if (pacingHelperText.AbandonmentIncrement !== helperText)
        setPacingHelperText({ ...pacingHelperText, [`${field}`]: helperText });
    }
  };

  const handleBasicConfigHandlers = (
    type: 'liveParty' | 'answeringMachine',
    isContactFlow: boolean,
  ) => {
    if (type === 'liveParty' && isContactFlow === true)
      setLivePartyIsContactFlow(true);
    else setLivePartyIsContactFlow(false);
    if (type === 'answeringMachine' && isContactFlow === true)
      setAnsweringMachineIsContactFlow(true);
    else setAnsweringMachineIsContactFlow(false);
  };

  const handleCloseAlert = () => setOpenContactFlowOverrideAlert(false);

  // Always check all sequences for contact flow handlers against the campaign's contact flow override value? If one passes check on a callback (campaign value changes or handler value changes), open modal
  useEffect(() => {
    if (openContactFlowOverrideAlert === false && !skipModal) {
      let campaignOverrideExists =
        (campaign?.BaseConfig?.ContactFlowOverride?.length || 0) > 0;
      if (campaignOverrideExists) {
        let sequencesWithContactFlowHandlers = sequences.filter(
          (seq) =>
            seq.basicConfig.livePartyHandler === 'PASS_TO_CONTACT_FLOW' ||
            seq.basicConfig.answeringMachineHandler === 'PASS_TO_CONTACT_FLOW',
        );
        if (sequencesWithContactFlowHandlers.length > 0) {
          setOpenContactFlowOverrideAlert(true);
        }
      }
    }
    onCampaignChange();
  }, [campaign]);

  useEffect(() => {
    reset();
  }, [callingMode]);

  useEffect(() => {
    if (openContactFlowOverrideAlert === false) {
      let campaignOverrideExists =
        (campaign?.BaseConfig?.ContactFlowOverride?.length || 0) > 0;
      if (campaignOverrideExists) {
        if (livePartyIsContactFlow || answeringMachineIsContactFlow) {
          setOpenContactFlowOverrideAlert(true);
        }
      }
    }
  }, [livePartyIsContactFlow, answeringMachineIsContactFlow, campaign]);

  useEffect(() => {
    PubSub.subscribe('schedule_discard', (topic, msg) => {
      try {
        reset();
      } catch {
        console.log('error');
      }
    });
  }, []);

  useEffect(() => {
    if (callingMode === 'agentless' && sequences.length > 0) {
      const newSequences = sequences.map((seq) => {
        delete seq.pacing;
        return seq;
      });
      setSequences(newSequences);
      setFieldValue('sequences', newSequences);
      // } else if (callingMode === 'power' && sequences.length > 0) {
      //   const newSequences = sequences.map((seq) => ({
      //     ...seq,
      //     pacing: { clearPacing: 'no' },
      //   }));
      //   setSequences(newSequences);
      //   setFieldValue('sequences', newSequences);
    }
  }, [callingMode]);

  useEffect(() => {
    setSequences(values.sequences);
  }, [values.sequences]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source } = result;
    if (!destination) {
      return;
    }
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (destination.droppableId === source.droppableId) {
      const column: ISequence[] = [...sequences];
      const item: ISequence = column[source.index];

      column.splice(source.index, 1);
      column.splice(destination.index, 0, item);
      setSequences(column);
      setFieldValue('sequences', column);
    }
  };

  const handleAddSequence = () => {
    const basicConfig: IBasicConfig = (
      basicConfigRef.current as any
    ).getValues();
    const filteringAndSorting = (fnsRef.current as any).getValues();
    let pacing;
    if (pacingRef.current) pacing = (pacingRef.current as any).getValues();

    let filteringAndSortingError = false;
    let basicConfigError = false;
    let pacingError = false;

    setSequenceNameTouched(true);

    if (
      basicConfig.livePartyHandler === 'none' ||
      (basicConfig.livePartyHandler === 'PASS_TO_CONTACT_FLOW' &&
        basicConfig.livePartyContactFlow === 'none') ||
      basicConfig.answeringMachineHandler === 'none' ||
      (basicConfig.answeringMachineHandler === 'PASS_TO_CONTACT_FLOW' &&
        basicConfig.answeringMachineContactFlow === 'none') ||
      basicConfig.phones.length <= 0
    ) {
      basicConfigError = true;
    }

    Object.keys(filteringAndSorting).forEach((key) => {
      if (key === 'contactFilters' && filteringAndSorting[key].length <= 0) {
        filteringAndSortingError = true;
      }
    });

    if (pacingRef.current && pacing.clearPacing === 'yes') {
      if (
        pacing.initialCpaMode == 'none' ||
        pacing.abaCalculation == 'none' ||
        pacingErrors[`InitialCpa`] === true ||
        pacingErrors[`InitialPacingDuration`] === true ||
        pacingErrors[`InitialPacingSamples`] === true ||
        pacingErrors[`CpaModifier`] === true ||
        pacingErrors[`AbandonmentIncrement`] === true ||
        pacingErrors[`AbaTargetRate]`] === true
      ) {
        pacingError = true;
      }
    }

    let sequence;

    if (
      sequenceName === '' ||
      basicConfigError ||
      filteringAndSortingError ||
      pacingError
    ) {
      setBasicConfigError(basicConfigError);
      setFnSError(filteringAndSortingError);
      if (pacingRef.current) setPacingError(pacingError);
    } else if (pacingRef.current) {
      sequence = {
        sequenceName,
        basicConfig,
        filteringAndSorting,
        ...(values.campaign &&
          callingMode === 'power' &&
          pacing && {
            pacing,
          }),
      };

      const _sequences = [...sequences];
      _sequences.push(sequence);
      setSequences(_sequences);
      setFieldValue('sequences', _sequences);
      reset();
      forceUpdate();
    } else {
      sequence = {
        sequenceName,
        basicConfig,
        filteringAndSorting,
      };
      const _sequences = [...sequences];
      _sequences.push(sequence);
      setSequences(_sequences);
      setFieldValue('sequences', _sequences);
      reset();
      forceUpdate();
    }
  };

  const reset = () => {
    const basicConfigReset = (basicConfigRef.current as any).reSet;
    const fnsReset = (fnsRef.current as any).reSet;
    let pacingReset;
    if (pacingRef.current) pacingReset = (pacingRef.current as any).reSet;

    setBasicConfigError(false);
    setFnSError(false);
    setPacingError(false);
    setPacingErrors({
      InitialCpa: false,
      InitialPacingDuration: false,
      InitialPacingSamples: false,
      AbandonmentIncrement: false,
      AbaTargetRate: false,
      CpaModifier: false,
    });
    setPacingHelperText({
      InitialCpa: '',
      InitialPacingDuration: '',
      InitialPacingSamples: '',
      AbandonmentIncrement: '',
      AbaTargetRate: '',
      CpaModifier: '',
    });

    setSequenceNameTouched(false);
    basicConfigReset();
    fnsReset();
    if (pacingRef.current) pacingReset();

    setSequenceName('');
    setEditIdex(null);

    setBasicConfigExpand(false);
    setFNSExpand(false);
    setPacingExpand(false);

    handleSequenceCallback(false);
  };

  const handleDeleteSequence = (index: number) => {
    const _sequences = [...sequences];
    _sequences.splice(index, 1);
    setSequences(_sequences);
    setFieldValue('sequences', _sequences);
    forceUpdate();
  };

  const handleCopySequence = (data: ISequence) => {
    const _sequences = [...sequences];
    _sequences.push(data);
    setSequences(_sequences);
    setFieldValue('sequences', _sequences);
    forceUpdate();
  };

  const handleEditSequence = (index: number, data: ISequence) => {
    const basicConfigSet = (basicConfigSetData: IBasicConfig) =>
      (basicConfigRef.current as any).setData(basicConfigSetData);
    const fnsSet = (fnsData: IFilteringNSorting) =>
      (fnsRef.current as any).setData(fnsData);

    let pacingSet;
    if (pacingRef.current) {
      pacingSet = (pacingSetData: IPacingSeq) =>
        (pacingRef.current as any).setData(pacingSetData);
    }

    setSequenceName(data.sequenceName);
    basicConfigSet(data.basicConfig);
    fnsSet(data.filteringAndSorting);
    if (data.pacing) pacingSet(data.pacing);

    setBasicConfigExpand(true);
    setFNSExpand(true);
    setPacingExpand(true);
    setIsEdit(true);
    setEditIdex(index);
  };

  const handleUpdateSequence = () => {
    const basicConfig: IBasicConfig = (
      basicConfigRef.current as any
    ).getValues();
    const filteringAndSorting = (fnsRef.current as any).getValues();
    const pacing = (pacingRef.current as any)?.getValues();
    let basicConfigError = false;
    let filteringAndSortingError = false;
    let pacingError = false;

    setSequenceNameTouched(true);

    if (
      basicConfig.livePartyHandler === 'none' ||
      (basicConfig.livePartyHandler === 'PASS_TO_CONTACT_FLOW' &&
        basicConfig.livePartyContactFlow === 'none') ||
      basicConfig.answeringMachineHandler === 'none' ||
      (basicConfig.answeringMachineHandler === 'PASS_TO_CONTACT_FLOW' &&
        basicConfig.answeringMachineContactFlow === 'none') ||
      basicConfig.phones.length <= 0
    ) {
      basicConfigError = true;
    }

    Object.keys(filteringAndSorting).forEach((key) => {
      if (key === 'contactFilters' && filteringAndSorting[key].length <= 0) {
        filteringAndSortingError = true;
      }
    });

    if (pacingRef.current && pacing.clearPacing === 'yes') {
      if (
        pacing.initialCpaMode == 'none' ||
        pacing.abaCalculation == 'none' ||
        pacingErrors[`InitialCpa`] === true ||
        pacingErrors[`InitialPacingDuration`] === true ||
        pacingErrors[`InitialPacingSamples`] === true ||
        pacingErrors[`CpaModifier`] === true ||
        pacingErrors[`AbandonmentIncrement`] === true ||
        pacingErrors[`AbaTargetRate]`] === true
      ) {
        pacingError = true;
      }
    }

    let sequence;

    if (
      sequenceName === '' ||
      basicConfigError ||
      filteringAndSortingError ||
      pacingError
    ) {
      setBasicConfigError(basicConfigError);
      setFnSError(filteringAndSortingError);
      if (pacingRef.current) setPacingError(pacingError);
    } else if (pacingRef.current) {
      sequence = {
        sequenceName,
        basicConfig,
        filteringAndSorting,
        ...(values.campaign &&
          callingMode === 'power' &&
          pacing && {
            pacing,
          }),
      };

      const _sequences = [...sequences];
      _sequences.splice(editIndex as number, 1, sequence);
      setSequences(_sequences);
      setFieldValue('sequences', _sequences);
      reset();
      forceUpdate();
    } else {
      sequence = {
        sequenceName,
        basicConfig,
        filteringAndSorting,
      };

      const _sequences = [...sequences];
      _sequences.splice(editIndex as number, 1, sequence);
      setSequences(_sequences);
      setFieldValue('sequences', _sequences);
      reset();
      forceUpdate();
    }
    handleSequenceCallback(false);
    setIsEdit(false);
  };

  const handleCancelUpdateSequence = (index: number | null) => {
    setIsEdit(false);
    reset();
  };

  const validateFilter = () => {
    const basicConfig: IBasicConfig = (
      basicConfigRef.current as any
    ).getValues();
    const filteringAndSorting = (fnsRef.current as any).getValues();
    const contactFilters =
      filteringAndSorting.contactFilters.length > 0
        ? filteringAndSorting.contactFilters.map((c) => c.value)
        : [];
    const phoneFilters =
      filteringAndSorting.phoneFilters.length > 0
        ? filteringAndSorting.phoneFilters.map((c) => c.value)
        : [];

    const validationPayload = {
      campaignId: campaign.id,
      phones: basicConfig.phones,
      filterIds: [...contactFilters, ...phoneFilters],
      startTime: convertToHourMin(values.startTime),
      endTime: convertToHourMin(values.endTime),
      timezone: values.timeZone,
    };
    if (validationPayload.campaignId) {
      onMultipleValidation(validationPayload);
    } else {
      setOpenSnack(true);
      setSnackMessage('No Campaign is selected!');
    }
  };

  const willError = !!errors.sequences && touched.sequences;

  return (
    <Wrapper>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId='sequencesDropSite'>
          {(provided) => (
            <ItemList innerRef={provided.innerRef} {...provided.droppableProps}>
              {sequences.map((sequence, i) => (
                <SequenceWrapper
                  onEdit={(_index, data) => handleEditSequence(_index, data)}
                  onCopy={(data) => handleCopySequence(data)}
                  onDelete={(e) => handleDeleteSequence(e)}
                  data={sequence}
                  text={sequence.sequenceName}
                  key={i}
                  index={i}
                  aSequenceIsBeingEdited={[isBeingEdited, editIndex]}
                  isBeingEdited={editIndex === i ? true : false}
                  handleSequenceCallback={handleSequenceCallback}
                  values={values}
                />
              ))}
              {provided.placeholder}
            </ItemList>
          )}
        </Droppable>
      </DragDropContext>
      <Divider />
      <InputWrapper>
        <TopLabeledTextField
          label='Sequence Name'
          value={sequenceName}
          onChange={(e) => setSequenceName(e.target.value)}
          onBlur={() => setSequenceNameTouched(true)}
          error={sequenceName === '' && sequenceNameTouched}
          helperText={
            sequenceName === '' &&
            sequenceNameTouched &&
            'This Field is Required'
          }
        />
        {values.campaign && callingMode === 'power' && (
          <React.Fragment>
            <AccordionWrapper
              name='Pacing'
              expanded={pacingExpand}
              onChange={(_, expanded) => {
                setPacingExpand(expanded);
              }}
            >
              <Pacing
                campaigns={campaigns}
                dialerDefaults={dialerDefaults}
                campaign={campaign}
                pacingErrors={pacingErrors}
                helperText={pacingHelperText}
                errorHandler={errorHandler}
                pacingExpanded={pacingExpand}
                selectedSchedule={selectedSchedule}
                isEdit={isEdit}
                ref={pacingRef}
              />
            </AccordionWrapper>
            {pacingError && (
              <CustomHelperText error>
                Some Fields are Incorrect
              </CustomHelperText>
            )}
          </React.Fragment>
        )}
        <React.Fragment>
          <AccordionWrapper
            name='Basic Config'
            expanded={basicConfigExpand}
            onChange={(_, expanded) => setBasicConfigExpand(expanded)}
          >
            <BasicConfig
              campaigns={campaigns}
              dialerDefaults={dialerDefaults}
              campaign={campaign}
              contactFlows={contactFlows}
              ref={basicConfigRef}
              handleBasicConfigHandlers={handleBasicConfigHandlers}
            />
          </AccordionWrapper>
          {basicConfigError && (
            <CustomHelperText error>Some Fields are Missing</CustomHelperText>
          )}
        </React.Fragment>
        <React.Fragment>
          <AccordionWrapper
            name='Filtering and Sorting'
            expanded={fNSExpand}
            onChange={(_, expanded) => setFNSExpand(expanded)}
          >
            <FilteringAndSorting
              ref={fnsRef}
              contactFilters={contactFilters}
              phoneFilters={phoneFilters}
              contactSorting={contactSorting}
              contactLists={contactLists}
              campaign={campaign}
              onValidateFilters={() => {
                validateFilter();
              }}
            />
          </AccordionWrapper>
          {fnSError && (
            <CustomHelperText error>Some Fields are Missing</CustomHelperText>
          )}
        </React.Fragment>
      </InputWrapper>
      {sequences.length <= 0 && willError && (
        <CustomHelperText error={willError}>
          {errors.sequences}
        </CustomHelperText>
      )}
      <ButtonWrapper className='form-buttons'>
        {editIndex == null ? (
          <React.Fragment>
            <Button
              variant='outlined'
              color='primary'
              onClick={() => handleAddSequence()}
            >
              Add Sequence
            </Button>
            <Button
              variant='outlined'
              color='primary'
              onClick={() => {
                handleSequenceCallback(false);
                handleCancelUpdateSequence(editIndex);
              }}
            >
              Discard Sequence
            </Button>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Button
              variant='outlined'
              color='primary'
              onClick={() => {
                handleUpdateSequence();
              }}
            >
              Update Sequence
            </Button>
            <Button
              variant='outlined'
              color='primary'
              onClick={() => handleCancelUpdateSequence(editIndex)}
            >
              Cancel
            </Button>
          </React.Fragment>
        )}
      </ButtonWrapper>
      <Dialog open={openContactFlowOverrideAlert} onClose={handleCloseAlert}>
        <DialogTitle id='contact-flow-override-warning-title'>
          Contact Flow Override Warning
        </DialogTitle>
        <DialogContent>
          <DialogContentText id='contact-flow-override-warning-text'>
            The campaign in use by this schedule has a contact flow override. All
            contact flow handler values set on sequences will be ignored.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenContactFlowOverrideAlert(false)}
            color='primary'
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      <SnackbarComponent
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        open={openSnack}
        autoHideDuration={5000}
        onAlertClose={() => setOpenSnack(false)}
        alertMessage={snackMessage}
        severity={'warning'}
      />
    </Wrapper>
  );
};

Sequence.defaultProps = {
  // bla: 'test',
};
