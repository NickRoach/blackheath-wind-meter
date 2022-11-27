const AWS = require("aws-sdk");

AWS.config.apiVersions = {
  s3: "2006-03-01",
  // other service API versions
};
// Set the region
AWS.config.update({ region: "ap-southeast-2" });

const BUCKET_NAME = "blackheathweatherdata";
const BUCKET_KEY = "blackheathdata.json";
const MAX_DATA_LENGTH = 72;

exports.handler = async (event, context) => {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json",
  };

  const listObjectsInS3 = async (bucketName) => {
    const s3 = new AWS.S3();
    const params = {
      Bucket: bucketName,
      MaxKeys: 100,
    };
    return s3
      .listObjects(params, function (err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else {
          console.log("List");
          console.log(data);
        } // successful response
      })
      .promise()
      .then((data) => data.Contents);
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
      })
      .promise()
      .then((data) => JSON.parse(data.Body.toString("utf-8")));
  };

  function uploadObjectToS3(bucketName, key, data) {
    const s3 = new AWS.S3();
    const buf = Buffer.from(JSON.stringify(data));
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: buf,
      ContentType: "application/json",
    };
    return s3
      .upload(params, function (err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else console.log(data); // successful response
      })
      .promise()
      .then((data) => data);
  }

  const putObjectToS3 = async (bucketName, key, data) => {
    const s3 = new AWS.S3();
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: JSON.stringify(data),
      ContentType: "application/json",
    };
    return s3
      .putObject(params, function (err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else return data; // successful response
      })
      .promise()
      .then((data) => data);
  };

  const getWeatherData = async () => {
    console.log("Get Weather Data");
    const list = await listObjectsInS3(BUCKET_NAME);
    const found = list.find((item) => item.Key === BUCKET_KEY);
    if (found) {
      return await getObjectFromS3(BUCKET_NAME, BUCKET_KEY);
    } else {
      return [];
    }
  };

  const createWeatherData = async (data) => {
    const newData = {
      ...data,
      time: new Date().toLocaleString(undefined, {
        timeZone: "Australia/Sydney",
      }),
    };
    console.log("Incoming data");
    console.log(data);
    console.log("New Data");
    console.log(newData);
    const currentData = await getWeatherData();
    console.log("Current Data");
    console.log(currentData);
    if (currentData === "No Data") {
      const newDataArray = [];
      newDataArray.unshift(newData);
      return await uploadObjectToS3(BUCKET_NAME, BUCKET_KEY, newDataArray).then(
        (response) => {
          return {
            data: response,
            length: response.length,
          };
        }
      );
    } else {
      const newDataArray = currentData;
      newDataArray.unshift(newData);
      if (newDataArray.length > MAX_DATA_LENGTH) {
        newDataArray.pop();
      }
      await putObjectToS3(BUCKET_NAME, BUCKET_KEY, newDataArray);
      return newData;
    }
  };

  try {
    switch (event.routeKey) {
      case "GET /hello":
        body = "Hello";
        break;
      case "GET /blackheath":
        body = await getWeatherData();
        break;
      case "POST /blackheath":
        body = await createWeatherData(
          JSON.parse(event.body.toString("utf-8"))
        );
        break;
      default:
        throw new Error(`Unsupported route: "${event.routeKey}"`);
    }
  } catch (err) {
    statusCode = 400;
    body = `save function error ${err.message}`;
  } finally {
    body = JSON.stringify(body);
  }

  return {
    statusCode,
    body,
    headers,
  };
};
