const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'client-consumer',
  brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'client-group' });

const run = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'client-test', fromBeginning: true });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const event = JSON.parse(message.value.toString());
        console.log('Received client event:', event);
        console.log('Successfully processed client event:', message.value.toString());
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
          case 'recuperation':
            handleClientRecuperation(event.clientId);
            break;
          case 'recuperation_tous':
            handleAllClientsRecuperation();
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

const handleClientCreation = async (clientData) => {
  try {
    console.log('Handling client creation event:', clientData);
    const { nom, prenom, adresse, email, telephone } = clientData;
    const newClient = new Client({ nom, prenom, adresse, email, telephone });
    const client = await newClient.save();
    console.log('Client created:', client);
  } catch (error) {
    console.error('Error handling client creation event:', error);
  }
};

const handleClientModification = async (clientData) => {
  try {
    console.log('Handling client modification event:', clientData);
    const { id, nom, prenom, adresse, email, telephone } = clientData;
    const updatedClient = await Client.findByIdAndUpdate(id, { nom, prenom, adresse, email, telephone }, { new: true });
    console.log('Client updated:', updatedClient);
  } catch (error) {
    console.error('Error handling client modification event:', error);
  }
};

const handleClientSuppression = async (clientData) => {
  try {
    console.log('Handling client suppression event:', clientData);
    const clientId = clientData.id;
    const client = await Client.findById(clientId);
    if (!client) {
      console.error('Client not found for deletion');
      return;
    }
    await client.deleteOne();
    console.log('Client deleted successfully');
  } catch (error) {
    console.error('Error handling client suppression event:', error);
  }
};

const handleClientRecuperation = async (clientId) => {
  try {
    const client = await Client.findById(clientId);
    if (!client) {
      throw new Error('Client not found');
    }
    console.log('Client retrieved:', client);
  } catch (error) {
    console.error('Error while fetching client:', error);
    throw error;
  }
};

const handleAllClientsRecuperation = async () => {
  try {
    const clients = await Client.find();
    console.log('All clients retrieved:', clients);
  } catch (error) {
    console.error('Error while fetching all clients:', error);
    throw error;
  }
};

run().catch(console.error);