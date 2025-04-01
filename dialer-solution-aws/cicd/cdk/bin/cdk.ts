#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DialerAdminUiStack } from '../lib/dialer-admin-ui-stack'

const app = new cdk.App();
new DialerAdminUiStack(app, 'DialerAdminUiStack', {
  env: {
    account: 'YOUR_AWS_ACCOUNT_ID_HERE',
    region: 'YOUR_AWS_REGION_HERE',
  },
  domain: 'YOUR_ROUTE53_DOMAIN_HERE',
  subdomain: 'YOUR_CUSTOM_SUBDOMAIN_HERE',
  certificateArn: 'YOUR_CERTIFICATE_ARN_HERE',
});