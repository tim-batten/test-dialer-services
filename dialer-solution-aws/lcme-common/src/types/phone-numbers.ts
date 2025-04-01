export type PhoneNumberInfo = {
  friendlyName: string;
  callerID: string;
};

export type PhoneNumberApiResponse = {
  phoneNumbers: PhoneNumberInfo[];
};
