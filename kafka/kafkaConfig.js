const { Kafka } = require('kafkajs');
//const { Kafka } = require('kafka-node');

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092']
});

module.exports = kafka;
