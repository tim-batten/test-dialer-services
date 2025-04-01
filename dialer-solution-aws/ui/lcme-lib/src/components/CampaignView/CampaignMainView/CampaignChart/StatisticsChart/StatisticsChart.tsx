import { Title } from '../../../CampaignConfigurator/CampaignConfigurator.Styles';
import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Wrapper } from './StatisticsChart.Styles';

interface IStatisticsChart {
  data: any;
}

export const StatisticsChart: React.FunctionComponent<IStatisticsChart> = ({
  data,
}) => {
  return (
    <Wrapper>
      <Title variant='button'>Statistics</Title>
      <BarChart width={400} height={400} data={data}>
        <CartesianGrid strokeDasharray='3 3' />
        <XAxis dataKey='name' />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey='pv' stackId='a' fill='#8884d8' />
        <Bar dataKey='uv' stackId='a' fill='#82ca9d' />
      </BarChart>
    </Wrapper>
  );
};

StatisticsChart.defaultProps = {
  // bla: 'test',
};
