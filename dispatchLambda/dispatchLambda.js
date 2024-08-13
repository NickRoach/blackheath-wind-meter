import AWS from "aws-sdk";
const lambda = new AWS.Lambda();

const { config, S3 } = AWS;

config.apiVersions = {
  s3: "2006-03-01",
};
// Set the region
config.update({ region: "ap-southeast-2" });

const dispatchToDevProdLambdas = async () => {
  const devLambdaParams = {
    FunctionName: "blackheathWindMeterLambda-dev-f68f295", // the dev lambda function
    InvocationType: "Event",
    Payload: JSON.stringify(event),
  };

  const prodLambdaParams = {
    FunctionName: "blackheathWindMeterLambda-prod-400cd7b", // the prod lambda function
    InvocationType: "Event",
    Payload: JSON.stringify(event),
  };

  console.info("Invoking dev lambda");
  const devResult = lambda.invoke(devLambdaParams).promise();

  console.info("Invoking prod lambda");
  const prodResult = lambda.invoke(prodLambdaParams).promise();

  await Promise.all([devResult, prodResult]);
};

export async function handler(event, context) {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json",
  };

  if (event.headers.password === process.env.password) {
    await dispatchToDevProdLambdas();
  } else {
    statusCode = 401;
  }

  return {
    statusCode,
    body,
    headers,
  };
}
