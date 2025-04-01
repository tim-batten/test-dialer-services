/* eslint-disable no-unused-vars */
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { DuoColumnSelector } from '../../../../../commons/DuoColumnSelector';
import { IFilteringNSorting } from '../../../../../commons/types/schedulerTypes';
import { CustomHelperText } from '../../Sequence.Styles';
import { Wrapper } from './FilteringAndSorting.Styles';

interface IFilteringAndSorting {
  contactFilters: any;
  phoneFilters: any;
  contactSorting: any;
  contactLists: any;
  campaign: any;
  onValidateFilters: () => void;
}

const filteringAndSorting = (_props: IFilteringAndSorting, ref: any) => {
  const [contactFilters, setContactFilters] = useState<any>([]);
  const [phoneFilters, setPhoneFilters] = useState<string[]>([]);
  const [contactSorting, setContactSorting] = useState<string[]>([]);
  const [contactFiltersTouched, setContactFiltersTouched] = useState(false);
  const [phoneFiltersTouched, setPhoneFiltersTouched] = useState(false);
  const [contactSortingTouched, setContactSortingTouched] = useState(false);

  const [contactFilterValues, setContactFilterValues] = useState([]);
  const [phoneFilterValues, setPhoneFilterValues] = useState([]);
  const [contactSortingValues, setContactSortingValues] = useState([]);
  const [openAlert, setOpenAlert] = useState(false);


  function isValidFilter(filter: any) {
    const contactList = _props?.contactLists.filter(
      (cl) => cl?.id === _props?.campaign?.BaseConfig?.ContactListConfigID,
    );

    return contactList[0]?.ContactListTable === filter?.tableCL;
  }

  useEffect(() => {
    if (contactFilters) {
      const validFilters = _props.contactFilters?.filter((filter) =>
        isValidFilter(filter),
      );

      setContactFilterValues(
        validFilters?.map((filter) => {
          return {
            value: filter.id,
            label: filter.filterName,
          };
        }),
      );
    }
  }, [_props.contactFilters, _props?.campaign]);

  useEffect(() => {
    if (phoneFilters) {
      const validFilters = _props.phoneFilters?.filter((filter) =>
        isValidFilter(filter),
      );

      setPhoneFilterValues(
        validFilters?.map((filter) => {
          return {
            value: filter.id,
            label: filter.filterName,
          };
        }),
      );
    }
  }, [_props.phoneFilters, _props?.campaign]);

  useEffect(() => {
    if (contactSorting) {
      const validFilters = _props.contactSorting?.filter((filter) =>
        isValidFilter(filter),
      );

      setContactSortingValues(
        validFilters.map((filter) => {
          return {
            value: filter.id,
            label: filter.filterName,
          };
        }),
      );
    }
  }, [_props.contactSorting, _props?.campaign]);

  useImperativeHandle(ref, () => ({
    getValues: () => {
      setContactFiltersTouched(true);
      setPhoneFiltersTouched(true);
      setContactSortingTouched(true);
      return { contactFilters, phoneFilters, contactSorting };
    },
    reSet: () => {
      setContactFiltersTouched(false);
      setPhoneFiltersTouched(false);
      setContactSortingTouched(false);
      setContactFilters([]);
      setPhoneFilters([]);
      setContactSorting([]);
    },
    setData: (data: IFilteringNSorting) => {
      setContactFilters(data.contactFilters);
      setPhoneFilters(data.phoneFilters);
      setContactSorting(data.contactSorting);
    },
  }));

  const reHydrate = () => { };
  return (
    <Wrapper>
      <React.Fragment>
        <DuoColumnSelector
          name='contactFilters'
          label='Contact Filters'
          itemOptions={JSON.parse(JSON.stringify(contactFilterValues))}
          dependency={contactFilterValues}
          values={contactFilters}
          onChange={(e) => {
            setContactFilters(e);
            setContactFiltersTouched(true);
          }}
        />

        {contactFilters.length === 0 && contactFiltersTouched && (
          <CustomHelperText error>This Field is Required</CustomHelperText>
        )}
      </React.Fragment>
      <React.Fragment>
        <DuoColumnSelector
          name='phoneFilters'
          label='Phone Filters'
          itemOptions={JSON.parse(JSON.stringify(phoneFilterValues))}
          dependency={phoneFilterValues}
          values={phoneFilters}
          onChange={(e) => {
            setPhoneFilters(e);
            setPhoneFiltersTouched(true);
          }}
        />
        {/* {phoneFilters.length === 0 && phoneFiltersTouched && (
          <CustomHelperText error>This Field is Required</CustomHelperText>
        )} */}
      </React.Fragment>
      <DuoColumnSelector
        name='contactSorting'
        label='Contact Sorting'
        itemOptions={JSON.parse(JSON.stringify(contactSortingValues))}
        dependency={contactSortingValues}
        values={contactSorting}
        onChange={(e) => {
          setContactSorting(e);
          setContactSortingTouched(true);
        }}
      />
      {/* {contactSorting.length === 0 && contactSortingTouched && (
        <CustomHelperText error>This Field is Required</CustomHelperText>
      )} */}
      <Button variant="contained" color="primary" onClick={() => { setOpenAlert(true) }}>
        Validate Filters
      </Button>
      <Dialog
        open={openAlert}
        onClose={() => setOpenAlert(false)}
        aria-labelledby='alert-delete'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-delete'>Validate Filters</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            Validation request can take up to 10 mins. Are you sure you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAlert(false)} color='primary'>
            Cancel
          </Button>
          <Button
            onClick={() => {
              _props.onValidateFilters();
              setOpenAlert(false)
              // setOpenValidationResult(true)
            }}
            color='primary'
            autoFocus
          >
            Proceed
          </Button>
        </DialogActions>
      </Dialog>
    </Wrapper>
  );
};

export const FilteringAndSorting = forwardRef(filteringAndSorting);
