import React from 'react';
import { Pie, PieChart } from 'recharts';
import { Title } from '../../../CampaignConfigurator/CampaignConfigurator.Styles';
import { Wrapper } from './MetricChart.Styles';

interface IMetricChart {
  data: any;
}

export const MetricChart: React.FunctionComponent<IMetricChart> = ({
  data,
}) => {
  return (
    <Wrapper>
      <Title variant='button'>Sample Metrics</Title>
      <PieChart width={400} height={400}>
        <Pie data={data} dataKey='value' nameKey='name' fill='#8884d8' label />
      </PieChart>
    </Wrapper>
  );
};

MetricChart.defaultProps = {
  // bla: 'test',
};
