// this is our actual construct. this is both node and browser compatible.
// for browser you can run "npx webpack" and grab the output "bundle.js".
// for nodejs, you can require(".../index.js") of this package as usual.

const CDK = require("cdk-web");

const cdk = CDK.require("aws-cdk-lib");
const ec2 = CDK.require("aws-cdk-lib/aws-ec2");
const sqs = CDK.require("aws-cdk-lib/aws-sqs");
const sns = CDK.require("aws-cdk-lib/aws-sns");
const s3 = CDK.require("aws-cdk-lib/aws-s3");
const app = new cdk.App();
const stack = new cdk.Stack(app, "BrowserStack");
const vpc = new ec2.Vpc(stack, "VPC");
const queue = new sqs.Queue(stack, "Queue");
const topic = new sns.Topic(stack, "Topic");
const bucket = new s3.Bucket(stack, "Bucket");
const assembly = app.synth();

console.log(assembly);
