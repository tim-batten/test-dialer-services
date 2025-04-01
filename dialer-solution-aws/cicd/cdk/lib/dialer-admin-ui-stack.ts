import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3Deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudFront from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';

export interface DialerAdminUiStackProps extends cdk.StackProps {
  domain?: string;
  subdomain?: string;
  certificateArn?: string;
}

export class DialerAdminUiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: DialerAdminUiStackProps) {
    super(scope, id, props);
    const { domain, subdomain, certificateArn } = props || {};
    // Create the S3 bucket for static react assets
    const bucket = new s3.Bucket(this, 'DialerUiBucket', {
      bucketName: `navient-aws-dialer-frontend-${this.account}-${this.region}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      accessControl: s3.BucketAccessControl.PRIVATE,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    const cloudfrontOAI = new cloudFront.OriginAccessIdentity(this, 'AccessIdentity');

    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [bucket.arnForObjects('*')],
        principals: [new iam.CanonicalUserPrincipal(cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
      })
    );

    let zone: route53.IHostedZone | undefined;
    let certificate: acm.ICertificate | undefined;
    let fullDomain: string | undefined;
    if (domain) {
      zone = route53.HostedZone.fromLookup(this, 'AdminUiZone', {
        domainName: domain,
      });

      fullDomain = `${subdomain ? `${subdomain}.` : ''}${domain}`;

      certificate = certificateArn
        ? acm.Certificate.fromCertificateArn(this, 'AdminUiCert', certificateArn)
        : new acm.Certificate(this, 'AdminUiCert', {
            domainName: fullDomain,
            validation: acm.CertificateValidation.fromDns(zone),
          });
    }

    const rewriteFunction = new cloudFront.Function(this, 'UrlRewriteFunction', {
      functionName: 'single-page-application-url-rewrite',
      code: cloudFront.FunctionCode.fromFile({
        filePath: 'functions/single-page-app-url-rewrite/index.js',
      }),
    });

    // Cloudfront distribution for the S3 bucket
    const cloudfrontDistribution = new cloudFront.Distribution(this, 'CloudfrontDistribution', {
      certificate,
      domainNames: fullDomain ? [fullDomain] : undefined,
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new origins.S3Origin(bucket, {
          originAccessIdentity: cloudfrontOAI,
        }),
        functionAssociations: [
          {
            function: rewriteFunction,
            eventType: cloudFront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
        viewerProtocolPolicy: cloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    });

    let record: route53.IRecordSet | undefined;
    if (domain && zone) {
      record = new route53.ARecord(this, 'AdminUiRecord', {
        zone,
        recordName: fullDomain,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(cloudfrontDistribution)),
      });
    }

    // Deploy the static react assets to the S3 bucket
    const sourceAssets = new s3Deploy.BucketDeployment(this, 'UiBucketDeployment', {
      sources: [s3Deploy.Source.asset('../../ui/navient-web/build')],
      destinationBucket: bucket,
      distribution: cloudfrontDistribution,
    });
  }
}

// Run the following command to deploy the stack:
// $ cdk deploy --profile <your-aws-profile-name> --require-approval never
