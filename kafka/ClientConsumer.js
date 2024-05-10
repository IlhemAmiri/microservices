const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'client-consumer',
  brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'client-group' });

const run = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'client-events', fromBeginning: true });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const event = JSON.parse(message.value.toString());
        console.log('Received client event:', event);
        console.log('Successfully processed client event:', message.value.toString());
        // Traitez l'événement d'équipe ici en fonction de l'événement reçu (création, modification, suppression, etc.)
        // Exemple : Appelez les fonctions appropriées pour gérer les événements d'équipe
        switch (event.eventType) {
          case 'creation':
            handleClientCreation(event.clientData);
            break;
          case 'modification':
            handleClientModification(event.clientData);
            break;
          case 'suppression':
            handleClientSuppression(event.clientData);
            break;
          default:
            console.warn('Event type not recognized:', event.eventType);
        }
      },
    });
  } catch (error) {
    console.error('Error with Kafka consumer:', error);
  }
};

const handleClientCreation = (clientData) => {
  console.log('Handling client creation event:', clientData);
  // Logique pour gérer la création d'équipe ici
};

const handleClientModification = (clientData) => {
  console.log('Handling client modification event:', clientData);
  // Logique pour gérer la modification d'équipe ici
};

const handleClientSuppression = (clientData) => {
  console.log('Handling client suppression event:', clientData);
  // Logique pour gérer la suppression d'équipe ici
};

run().catch(console.error);