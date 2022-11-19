const AWS = require("aws-sdk");

AWS.config.apiVersions = {
  s3: "2006-03-01",
  // other service API versions
};
// Set the region
AWS.config.update({ region: "ap-southeast-2" });

const BUCKET_NAME = "blackheathweatherbucket";
const BUCKET_KEY = "blackheathdata.json";

exports.handler = async (event, context) => {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json",
  };

  const getObjectFromS3 = async (bucketName, key) => {
    const s3 = new AWS.S3();
    const params = {
      Bucket: bucketName,
      Key: key,
    };
    return s3
      .getObject(params, function (err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else console.log(data); // successful response
        /*
      data = {
       AcceptRanges: "bytes",
       ContentLength: 3191,
       ContentType: "image/jpeg",
       ETag: "\"6805f2cfc46c0f04559748bb039d69ae\"",
       LastModified: <Date Representation>,
       Metadata: {
       },
       TagCount: 2,
       VersionId: "null"
      }
      */
      })
      .promise()
      .then((data) => JSON.parse(data.Body.toString("utf-8")));
  };

  const putObjectToS3 = async (bucketName, key, data) => {
    const s3 = new AWS.S3();
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: data,
      ContentType: "application/json",
    };
    return s3
      .putObject(params, function (err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else return data; // successful response
      })
      .promise();
  };

  try {
    switch (event.routeKey) {
      case "GET /hello":
        body = "Hello";
        break;
      case "GET /blackheath":
        body = await getObjectFromS3(BUCKET_NAME, BUCKET_KEY);
        break;
      case "POST /blackheath":
        body = await putObjectToS3(
          BUCKET_NAME,
          BUCKET_KEY,
          JSON.parse(event.body.toString("utf-8"))
        );
        break;
      default:
        throw new Error(`Unsupported route: "${event.routeKey}"`);
    }
  } catch (err) {
    statusCode = 400;
    body = err.message;
  } finally {
    body = JSON.stringify(body);
  }

  return {
    statusCode,
    body,
    headers,
  };
};
