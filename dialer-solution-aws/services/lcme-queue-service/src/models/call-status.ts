type CallStatus = {
  contact_id: string;
  contact_flow_id: string;
  status: string;
  answered_by: string;
  to: string;
  from: string;
  disposition?: string;
  custom_data?: any;
};
