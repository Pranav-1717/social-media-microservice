const logger = require('./logger');
const amqp = require('amqplib');

let channel = null;
let connection = null;
const EXCHANGE_NAME = 'facebook_event';

const connectRabbitMQ = async () => {
  try {
    connection = await amqp.connect(process.env.RABBIT_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME,"topic",{ durable: true });
    console.log('Connected to RabbitMQ');
    return channel;
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error);

  }
};


const publishToQueue = async (routingKey, message) => {
    if(!channel) {
        await connectRabbitMQ();
    }

    channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(message)), {
        persistent: true,
    });
    console.log(`Message published to queue ${routingKey}:`, message);
};

const consumeFromQueue = async (routingKey, callback) => {      
    if(!channel) {
        await connectRabbitMQ();
    }

    const q = await channel.assertQueue("", { exclusive: true });
    await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);
    channel.consume(q.queue, (msg) => {
        if (msg !== null) {
            const message = JSON.parse(msg.content.toString());
            callback(message);
            channel.ack(msg);
        }
    }, { noAck: false });

    logger.info(`Waiting for messages in queue ${q.queue} with routing key ${routingKey}`);
}


module.exports = {
    connectRabbitMQ,
    publishToQueue,
    consumeFromQueue,
};

