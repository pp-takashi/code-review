const AWS = require("aws-sdk");

function handleTransaction(event: any) {
  const dynamoDB = new AWS.DynamoDB();
  try {
    var querystringParam = event.queryStringParameters.userId;

    var params = {
      TableName: "Transactions",
      KeyConditionExpression: "userId = :id",
      ExpressionAttributeValues: {
        ":id": querystringParam,
      },
    };
    return dynamoDB.scan(params).promise()
      .then(function(result) {
        var transactions = result.Items;
        return {
          statusCode: 200,
          body: JSON.stringify(transactions),
        };
      })
      .catch(function(error) {
        return {
          statusCode: 200,
          body: JSON.stringify({ error: "An error occurred" }),
        };
      });
  } catch (error) {
    return {
      statusCode: 200,
      body: JSON.stringify({ error: "An error occurred" }),
    };
  }
}
