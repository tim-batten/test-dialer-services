export type AwsServiceMeta = {
  copyright: string;
  disclaimer: string;
  'format:version': string;
  'source:version': string;
};

export type AwsServiceAttributes = {
  'aws:region': string;
  'aws:serviceName': string;
  'aws:serviceUrl': string;
};

export type AwsServicePrice = {
  attributes: AwsServiceAttributes;
  id: string;
};

export type AwsRegionsTable = {
    metadata: AwsServiceMeta;
    prices: AwsServicePrice[];
};
