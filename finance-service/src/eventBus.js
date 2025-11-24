// in-memory event bus
const subscribers = {};

// subscribe to event type
function subscribe(eventType, callback){
    if (!subscribers[eventType]){
        subscribers[eventType] = [];
    }
    subscribers[eventType].push(callback);
}

// publish event
function publish(eventType, eventData){
    const subs = subscribers[eventType] || [];
    subs.forEach((cb) => cb(eventData));
}

module.exports = {subscribe, publish};