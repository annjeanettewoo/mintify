const amqp = require('amqplib');
const Budget = require('./models/Budget');

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const EXCHANGE_NAME = process.env.RABBITMQ_EXCHANGE || 'mintify.events';
const QUEUE_NAME = process.env.RABBITMQ_BUDGET_QUEUE || 'mintify.budget';

// Convert ISO date string to period string
function getPeriodFromDate(dateStr) {
    if (!dateStr) {
        return null;
    }
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) {
        return null;
    }
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

// Find matching budget by userId, category, period and increment "spent"
// SPENDING_RECORDED event: { type, transactionId, userId, amount, category, date, occurredAt }
async function handleSpendingRecorded(event) {
    const { userId, amount, category, date } = event;

    if (!userId || !amount || !category) {
        console.warn('SPENDING_RECORDED missing fields:', event);
        return;
    }

    const period = getPeriodFromDate(date);

    const filter = {
        userId,
        category,
    };

    if (period) {
        filter.period = period;
    } else {
        filter.period = null;
    }

    try {
        const result = await Budget.findOneAndUpdate(
            filter,
            { $inc: { spent: amount } },
            { new: true }
        );

        if (!result) {
            console.log(
                `No matching budget found for userId=${userId}, category=${category}, period=${period}`
            );
        } else {
            console.log(
                `Updated budget spent for userId=${userId}, category=${category}, period=${period}, new spent=${result.spent}`
            );
        }
    } catch (err) {
        console.error('Error updating budget from SPENDING_RECORDED event.', err);
    }
}

// Start RabbitMQ consumer for budget-service
async function startBudgetConsumer() {
    if (!RABBITMQ_URL) {
        console.warn('RABBITMQ_URL not set, skipping RabbitMQ consumer in budget-service.');
        return;
    }

    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        await channel.assertExchange(EXCHANGE_NAME, 'topic', {
            durable: true,
        });

        const q = await channel.assertQueue(QUEUE_NAME, {
            durable: true,
        });

        await channel.bindQueue(q.queue, EXCHANGE_NAME, 'spending.recorded');

        console.log(
            `RabbitMQ consumer (budget-service) bound to exchange=${EXCHANGE_NAME}, queue=${q.queue}`
        );

        channel.consume(q.queue, async (msg) => {
            if (!msg) {
                return;
            }

            try {
                const raw = msg.content.toString();
                const event = JSON.parse(raw);

                if (event.type === 'SPENDING_RECORDED') {
                    await handleSpendingRecorded(event);
                }

                channel.ack(msg);
            } catch (err) {
                console.error('Error handling RabbitMQ message in budget-service.', err);
                channel.nack(msg, false, false);
            }
        });
    } catch (err) {
        console.error('Failed to start RabbitMQ consumer in budget-service.', err);
    }
}

module.exports = { startBudgetConsumer };
