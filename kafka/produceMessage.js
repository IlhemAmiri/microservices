const kafka = require('./kafkaConfig');

const producer = kafka.producer();

const produceMessage = async (topic, message) => {
await producer.connect();
  await producer.send({
    topic: topic,
    messages: [
      { value: JSON.stringify(message) },
    ],
  });
  await producer.disconnect();
};

module.exports = produceMessage;
