import { DynamoDB } from "aws-sdk";

export const handleTransaction = async (event: any): Promise<any> => {
  const dynamoDB = new DynamoDB();
  try {
    const userId = event.queryStringParameters.userId;

    const params = {
      TableName: "Transactions",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    };
    const result = await dynamoDB.scan(params).promise();

    const transactions = result.Items;
    return {
      statusCode: 200,
      body: JSON.stringify(transactions),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "An error occurred" }),
    };
  }
};
