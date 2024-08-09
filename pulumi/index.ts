import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const config = new pulumi.Config();

// Retrieve stack-specific configurations
const lambdaFunctionName = config.require("lambdaFunctionName");
const apiGatewayStageName = config.require("apiGatewayStage");
const s3BucketName = config.require("s3BucketName");

// Define the Lambda function
const role = new aws.iam.Role(`${lambdaFunctionName}-role`, {
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
    Service: "lambda.amazonaws.com",
  }),
});

const policy = pulumi.all([s3BucketName]).apply(
  ([bucketName]) =>
    new aws.iam.Policy(`${lambdaFunctionName}-policy`, {
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
            ],
            Resource: "arn:aws:logs:*:*:*",
          },
          {
            Effect: "Allow",
            Action: ["s3:GetObject", "s3:ListBucket"],
            Resource: [
              `arn:aws:s3:::${bucketName}`,
              `arn:aws:s3:::${bucketName}/*`,
            ],
          },
        ],
      }),
    })
);

new aws.iam.RolePolicyAttachment(
  `${lambdaFunctionName}-logging-policy-attachment`,
  {
    role: role.name,
    policyArn: policy.arn,
  }
);

const lambdaFunction = new aws.lambda.Function(lambdaFunctionName, {
  runtime: aws.lambda.Runtime.NodeJS20dX,
  code: new pulumi.asset.AssetArchive({
    ".": new pulumi.asset.FileArchive("../lambda"),
  }),
  handler: "blackheathWeatherLambda.handler",
  role: role.arn,
});

// Define the API Gateway
const api = new aws.apigatewayv2.Api(`${lambdaFunctionName}-api`, {
  protocolType: "HTTP",
});

new aws.lambda.Permission(`${lambdaFunctionName}-invoke-permission`, {
  action: "lambda:InvokeFunction",
  function: lambdaFunction.name,
  principal: "apigateway.amazonaws.com",
  sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
});

const integration = new aws.apigatewayv2.Integration(
  `${lambdaFunctionName}-integration`,
  {
    apiId: api.id,
    integrationType: "AWS_PROXY",
    integrationUri: lambdaFunction.arn,
    payloadFormatVersion: "2.0",
  }
);

new aws.apigatewayv2.Route(`${lambdaFunctionName}-get`, {
  apiId: api.id,
  routeKey: "GET /blackheath",
  target: pulumi.interpolate`integrations/${integration.id}`,
});

new aws.apigatewayv2.Route(`${lambdaFunctionName}-post`, {
  apiId: api.id,
  routeKey: "POST /blackheath",
  target: pulumi.interpolate`integrations/${integration.id}`,
});

new aws.apigatewayv2.Route(`${lambdaFunctionName}-getHello`, {
  apiId: api.id,
  routeKey: "GET /hello",
  target: pulumi.interpolate`integrations/${integration.id}`,
});

const stage = new aws.apigatewayv2.Stage(`${lambdaFunctionName}-stage`, {
  apiId: api.id,
  name: apiGatewayStageName,
  autoDeploy: true,
});

export const apiUrl = stage.invokeUrl;
