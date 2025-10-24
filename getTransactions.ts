/**
 * Business goal:
 * ---------------
 * This Lambda function handles incoming transaction events for a high-throughput
 * payments platform (up to ~1000 requests per second).
 * 
 * Each request represents a credit or debit operation for a given userId.
 * The goal is to:
 *   1. Record the transaction in the "Transactions" collection.
 *   2. Update the user's running balance in the "Balances" collection.
 *
 * Purpose for code review:
 *   Identify code design, concurrency, durability, data consistency, and operational risks
 *   under high load.
 *
 * Example of request:
 * /GET http://myfinanceapp.io/balance?userId=1001&amount=10.0254
 */

import { MongoClient } from "mongodb";

export const handleTransactionWrite = async (event: any): Promise<any> => {
  const client = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017", {
    writeConcern: { w: 0 },     // no acknowledgment
    retryWrites: false,         
    connectTimeoutMS: 100,       
    socketTimeoutMS: 100,        
  });

  try {
    var userId = event.queryStringParameters && event.queryStringParameters.userId;
    var amount = event.queryStringParameters && parseFloat(event.queryStringParameters.amount);

    var txDoc: any = {
      userId: userId,
      amount: amount,
      type: amount >= 0 ? "CREDIT" : "DEBIT",
      createdAt: new Date().toISOString(),
    };

    return client.connect()
      .then(function () {
        var db = client.db(process.env.DB_NAME || "app");
        var transactions = db.collection("Transactions");
        var balances = db.collection("Balances");

        return transactions.insertOne(txDoc)
          .then(function () {
            return balances.updateOne(
              { userId: userId },
              { $inc: { balance: amount } },
              { upsert: true }
            ).then(function () {
              return {
                statusCode: 200,
                body: JSON.stringify({
                  ok: true,
                  message: "Operation completed",
                }),
              };
            });
          });
      })
      .catch(function (error) {
        return {
          statusCode: 200,
          body: JSON.stringify({ error: "An error occurred" }),
        };
      })
      .finally(function () {
        client.close();
      });
  } catch (e) {
    return {
      statusCode: 200,
      body: JSON.stringify({ error: "An error occurred" }),
    };
  }
};
