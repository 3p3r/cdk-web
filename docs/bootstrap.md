# `cdk bootstrap` for cdk-web

you must bootstrap your AWS account if you want to interact and deploy directly from within the browser.

## automatically using cdk-web's pseudo cli

a `bootstrap()` method is exposed that you can leverage:

```JS
const cli = new CDK.PseudoCli({ credentials: { accessKeyId: "...", secretAccessKey: "..." }});
await cli.bootstrap();
```

for more in-depth documentation take a look at cli's [documentation](./cli.md).

## manually with native tooling

instructions for bootstrapping is the same as vanilla cdk. you should grab cdk native tooling and bootstrap your account
with a dummy empty cdk app.

after bootstrapping you need to take one extra step to get things working. you need to set a cors policy on the bucket
that `cdk bootstrap` created for you.

here is a snippet that bootstraps a fresh account and enables a wildcard allow-everything cors on the bucket:

```bash
mkdir cdk-temp && cd cdk-temp
cdk init app --language=javascript
cdk bootstrap
export CDKToolkitBucket=$(aws cloudformation describe-stacks --stack-name CDKToolkit --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" --output text)
echo '{"CORSRules":[{"AllowedHeaders":["*"],"AllowedMethods":["HEAD","GET","POST","PUT","DELETE"],"AllowedOrigins":["*"]}]}' > cors.json
aws s3api put-bucket-cors --bucket $CDKToolkitBucket --cors-configuration file://cors.json
cd .. && rm -rf cdk-temp
```

to summarize you need to:

1. bootstrap your account as usual with native cdk
1. find cdk's bootstrap bucket in your account
1. set a cors policy on it that makes sense for your use case
