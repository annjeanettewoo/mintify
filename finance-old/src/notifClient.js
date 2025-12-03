const axios = require('axios');

// override in docker/k8s *temp*
const NOTIF_SERVICE_URL = process.env.NOTIF_SERVICE_URL || 'http://localhost:4003/notify';

async function sendSpendingRecordedNotification({id, amount, category, date}){
    try{
        await axios.post(NOTIF_SERVICE_URL, {
            type: 'SPENDING_RECORDED',
            message: `Spending recorded: ${category} ${amount}`,
            payload: {
                transactionId: id,
                amount,
                category,
                occuredAt: date
            },
        });
    } catch (err){
        console.error('Failed to send notification to notif-service:', err.message);
    }
}

module.exports = {sendSpendingRecordedNotification};