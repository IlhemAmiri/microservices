const kafka = require('./kafkaConfig');

const consumer = kafka.consumer({ groupId: 'test-group' });

const consumeMessages = async (topic, callback) => {
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      callback(topic, message.value.toString());
    },
  });
};

module.exports = consumeMessages;
