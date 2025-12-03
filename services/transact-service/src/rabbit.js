const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const EXCHANGE_NAME = process.env.RABBITMQ_EXCHANGE || 'mintify.events';

let channel;

// Connect to RabbitMQ and create channel + exchange
async function initRabbit() {
    if (!RABBITMQ_URL) {
        console.warn('RABBITMQ_URL not set, RabbitMQ disabled for transact-service.');
        return;
    }

    if (channel) {
        return;
    }

    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();

        await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

        console.log('Connected to RabbitMQ (transact-service).');
    } catch (err) {
        console.error('Failed to connect to RabbitMQ (transact-service).', err);
        // Do not exit process; app functions without events
    }
}

// Publish "SPENDING_RECORDED" event when expense transaction is created
async function publishSpendingRecorded(event) {
    if (!channel) {
        console.warn('RabbitMQ channel not ready, skipping event.', event);
        return;
    }

    try {
        const routingKey = 'spending.recorded';
        const payload = Buffer.from(JSON.stringify(event));

        channel.publish(EXCHANGE_NAME, routingKey, payload, {
            persistent: true,
        });
        console.log('[rabbit-transact] Published SPENDING_RECORDED', event);
    } catch (err) {
        console.error('Error publishing SPENDING_RECORDED event.', err);
    }
}

module.exports = {
    initRabbit,
    publishSpendingRecorded
};
