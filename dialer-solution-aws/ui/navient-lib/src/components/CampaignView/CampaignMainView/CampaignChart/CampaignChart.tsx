/* eslint-disable no-empty-pattern */
import { Title } from '../../CampaignConfigurator/CampaignConfigurator.Styles';
import React from 'react';
import { GraphWrapper, Wrapper } from './CampaignChart.Styles';
import { MetricChart } from './MetricChart';
import { StatisticsChart } from './StatisticsChart';
import { metricData, statisticData } from './__mock__/mockData';

interface ICampaignChart {}

export const CampaignChart: React.FunctionComponent<ICampaignChart> = ({}) => {
  return (
    <Wrapper>
      <Title variant='h6'>Campaign Oversight</Title>
      <GraphWrapper>
        <StatisticsChart data={statisticData} />
        <MetricChart data={metricData} />
      </GraphWrapper>
    </Wrapper>
  );
};

CampaignChart.defaultProps = {
  // bla: 'test',
};
