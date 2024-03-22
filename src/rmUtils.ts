/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import amqp from 'amqplib'

export const rmConnect = async () => {
  const host = process.env.RABBIT_HOST;
  const port = process.env.RABBIT_PORT;
  return await amqp.connect(`amqp://${host}:${port}`);
}




