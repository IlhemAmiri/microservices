const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();

const sendRoomMessage = async (eventType, roomData) => {
  try {
    await producer.connect();
    await producer.send({
      topic: 'room-test',
      messages: [
        { value: JSON.stringify({ eventType, roomData }) }
      ],
    });
    console.log('Message Kafka envoyé avec succès pour l\'événement:', eventType);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message Kafka:', error);
  } finally {
    await producer.disconnect();
  }
};

module.exports = {
  sendRoomMessage
};
