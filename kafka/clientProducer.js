const { Kafka  } = require('kafkajs');


const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092'],

});

const producer = kafka.producer();


const sendClientMessage = async (eventType, clientData) => {
  try {
    await producer.connect();
    await producer.send({
      topic: 'client-test', 
      messages: [
        { value: JSON.stringify({ eventType, clientData }) }
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
    sendClientMessage
  };