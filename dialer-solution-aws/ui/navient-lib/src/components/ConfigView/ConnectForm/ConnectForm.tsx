import React, { useEffect, useState } from 'react';
import { getInstanceARNs } from '../../../api';
import { ConnectInstanceInfo } from '../../../types/connect-instance';
import { CustomAutoCompleteField } from '../../commons/CustomAutoCompleteField';
import { CustomFormikNumberField } from '../../commons/CustomFormikNumberField';
import { awsRegionLabels } from '../../commons/utils/AWSRegion';
import { TextWrapper, Wrapper } from './ConnectForm.Styles';

interface IConnectForm {
  awsRegions?: string[];
  awsRegion?: string;
}

export const ConnectForm: React.FunctionComponent<IConnectForm> = (props) => {
  const [arnInstance, setArnInstance] = useState([]);
  const [connectInstances, setConnectInstances] = useState<
    ConnectInstanceInfo[]
  >([]);
  const { awsRegions = [], awsRegion = 'us-west-2' } = props;
  useEffect(() => {
    if (!awsRegion?.length) return;
    getInstanceARNs(awsRegion).then((res) => {
      setConnectInstances(res.data);
    });
  }, [awsRegion]);

  return (
    <Wrapper>
      <CustomAutoCompleteField
        options={awsRegions.map((region) => ({
          label: awsRegionLabels[region]
            ? `${awsRegionLabels[region]} (${region})`
            : region,
          value: region,
        }))}
        name='awsRegion'
        label='AWS Region'
        placeholder='Please Select'
      />
      <TextWrapper>
        <CustomAutoCompleteField
          options={connectInstances.map((connectInstance) => ({
            label: `${connectInstance.InstanceAlias} (${connectInstance.Arn})`,
            value: connectInstance.Arn,
          }))}
          name='instanceArn'
          label='Instance ARN'
          placeholder='Please Select'
        />
        <CustomFormikNumberField
          name='connectProjectCPS'
          label='Connect Project CPS'
          min={1}
          max={1000}
        />
      </TextWrapper>
    </Wrapper>
  );
};

ConnectForm.defaultProps = {};
