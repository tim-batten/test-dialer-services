/* eslint-disable no-empty-pattern */
import React, { useEffect } from "react";
import { Route } from "react-router";
import { getGlobalConfig } from "../../../redux/actions/GlobalActions";
import { useAppDispatch } from "../../../redux/hook";
import SchedulerView from "../../SchedulerView/";
import CampaignView from "../../CampaignView/";
import CampaignOversight from "../../CampaignOversight";
import FilterSortView from "../../FilterSortView";
import ContactListView from "../../ContactListView/";
import ConfigView from "../../ConfigView/";
import { Wrapper } from "./MainViewPanel.Styles";

interface IMainViewPanel {}

export const MainViewPanel: React.FunctionComponent<IMainViewPanel> = (
  props
) => {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(getGlobalConfig());
  }, [dispatch]);
  return (
    <Wrapper>
      <Route path="/campaigns" component={CampaignView} />
      <Route path="/schedules" component={SchedulerView} />
      <Route path="/campaign_oversight" component={CampaignOversight} />
      <Route path="/filter_sort" component={FilterSortView} />
      <Route path="/contacts" component={ContactListView} />
      <Route path="/config" component={ConfigView} />
    </Wrapper>
  );
};

MainViewPanel.defaultProps = {
  // bla: 'test',
};
