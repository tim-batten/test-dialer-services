import * as yup from 'yup';

export type SingleAccountConfig = {
  apiUrl: string;
  logRefreshRate: number;
};

export type MultiAccountConfig = {
  url: string;
  name: string;
  shortCode: string;
  color: string;
};

export type AmazonCognitoConfig = {
  region: string;
  userPoolId: string;
  userPoolAppClientId: string;
};

export type WindowEnv = {
  config: SingleAccountConfig;
  accounts: MultiAccountConfig[];
  amazonCognito: AmazonCognitoConfig;
  basePath: string;
};

const configSchema = yup.object().shape({
  apiUrl: yup.string().required(),
  logRefreshRate: yup.number().required(),
});
const accountsConfigSchema = yup.object().shape({
  url: yup.string().required(),
  name: yup.string().required(),
  shortCode: yup.string().required(),
  color: yup.string().required(),
});
const amazonCognitoConfigSchema = yup.object().shape({
  region: yup.string().required(),
  userPoolId: yup.string().required(),
  userPoolAppClientId: yup.string().required(),
});
const windowEnvSchema = yup.object().shape({
  config: configSchema,
  accounts: yup.array().of(accountsConfigSchema).min(1),
  amazonCognito: amazonCognitoConfigSchema,
  basePath: yup.string().default('/web'),
});

export const loadWindowEnv = (): WindowEnv => {
  const windowEnv = (window as any).env?.envConfig;
  windowEnvSchema.validateSync(windowEnv);
  return windowEnv;
};
