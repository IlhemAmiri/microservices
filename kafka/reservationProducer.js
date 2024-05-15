const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();

const sendReservationMessage = async (eventType, reservationData) => {
  try {
    await producer.connect();
    await producer.send({
      topic: 'reservation-test',
      messages: [
        { value: JSON.stringify({ eventType, reservationData }) }
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
  sendReservationMessage
};
