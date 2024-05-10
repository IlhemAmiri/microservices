const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDB = require('./config/database');
const Client = require('./models/clientModel');
const Room = require('./models/roomModel');
const Reservation = require('./models/reservationModel');
const protoLoader = require('@grpc/proto-loader');
const grpc = require('@grpc/grpc-js');
//const { sendClientMessage } = require('./kafka/clientProducer');
const app = express();

connectDB();
const clientProtoPath = './proto/client.proto';
const clientProtoDefinition = protoLoader.loadSync(clientProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const reservationProtoPath = './proto/reservation.proto';
const reservationProtoDefinition = protoLoader.loadSync(reservationProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const clientProto = grpc.loadPackageDefinition(clientProtoDefinition).client;
const reservationProto = grpc.loadPackageDefinition(reservationProtoDefinition).reservation;
const ReservationService = new reservationProto.ReservationService('localhost:50056', grpc.credentials.createInsecure());
const client = new clientProto.ClientService('localhost:50054', grpc.credentials.createInsecure());


app.use(cors());
app.use(bodyParser.json());

// Route pour récupérer une réservation
app.get('/reservation/:id', (req, res) => {
    const reservationId = req.params.id;
    ReservationService.getReservation({ reservation_id: reservationId }, (err, response) => {
      if (err) {
        res.status(500).send("Error while fetching reservation: " + err.message);
        return;
      }
      res.json(response.reservation);
    });
  });
  
  // Route pour créer une réservation
  app.post('/reservation', async (req, res) => {
    try {
        const { client, room, dateStart, dateEnd } = req.body;

        // Vérification si le client existe
        const clientData = await Client.findOne({ _id: client });
        if (!clientData) {
            return res.status(400).send("Client not found");
        }

        // Vérification si la chambre existe
        const roomData = await Room.findById(room);
        if (!roomData) {
            return res.status(400).send("Room not found");
        }

        if (roomData.status !== 'libre') {
            return res.status(400).send("Room is not available");
        }

        // Mise à jour du statut de la chambre
        roomData.status = 'réservée';
        await roomData.save();

        // Création de la réservation
        const newReservation = new Reservation({ client, room, dateStart, dateEnd });
        const reservation = await newReservation.save();
        res.json(reservation);
    } catch (err) {
        res.status(500).send("Error while creating reservation: " + err.message);
    }
});


  
  // Route pour mettre à jour une réservation
  app.put('/reservation/:id', (req, res) => {
    const reservationId = req.params.id;
    const { client_id, room_id, dateStart, dateEnd } = req.body;
    ReservationService.updateReservation({ reservation_id: reservationId, client, room, dateStart, dateEnd }, (err, response) => {
      if (err) {
        res.status(500).send("Error while updating reservation: " + err.message);
        return;
      }
      res.json(response.reservation);
    });
  });
  
  // Route pour supprimer une réservation
  app.delete('/reservation/:id', (req, res) => {
    const reservationId = req.params.id;
    ReservationService.deleteReservation({ reservation_id: reservationId }, (err, response) => {
      if (err) {
        res.status(500).send("Error while deleting reservation: " + err.message);
        return;
      }
      res.json({ message: "Reservation deleted successfully" });
    });
  });
  
  // Route pour récupérer toutes les réservations
  app.get('/reservation', (req, res) => {
    ReservationService.getAllReservations({}, (err, response) => {
      if (err) {
        res.status(500).send("Error while fetching all reservations: " + err.message);
        return;
      }
      res.json(response.reservations);
    });
  });

// Routes gRPC pour les clients
app.post('/grpc/client', (req, res) => {
    client.createClient(req.body, (err, response) => {
      if (err) {
        res.status(500).send("Error while creating client: " + err.message);
        return;
      }
      res.json(response.client);
    });
  });
  
  app.put('/grpc/client/:id', (req, res) => {
    const requestData = Object.assign({}, req.body, { client_id: req.params.id });
    client.updateClient(requestData, (err, response) => {
      if (err) {
        res.status(500).send("Error while updating client: " + err.message);
        return;
      }
      res.json(response.client);
    });
  });
  
  app.get('/grpc/client', (req, res) => {
    client.getAllClients({}, (err, response) => {
      if (err) {
        res.status(500).send("Error while fetching all clients: " + err.message);
        return;
      }
      res.json(response.clients);
    });
  });
  
  app.get('/grpc/client/:id', (req, res) => {
    client.getClient({ client_id: req.params.id }, (err, response) => {
      if (err) {
        res.status(500).send("Error while fetching client: " + err.message);
        return;
      }
      res.json(response.client);
    });
  });
  
  app.delete('/grpc/client/:id', (req, res) => {
    const client_id = req.params.id;
    client.deleteClient({ client_id }, (err, response) => {
      if (err) {
        res.status(500).send("Error while deleting client: " + err.message);
        return;
      }
      res.json({ message: "client deleted successfully" });    });
  });
  //route rest
app.get('/client', async (req, res) => {
    try {
        const clients = await Client.find();
        res.json(clients);
    } catch (err) {
        res.status(500).send("Error while fetching clients: " + err.message);
    }
});

app.get('/client/:id', async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).send("Client not found");
        }
        res.json(client);
    } catch (err) {
        res.status(500).send("Error while fetching client: " + err.message);
    }
});

app.post('/client', async (req, res) => {
    try {
        const { nom, prenom, adresse, email, telephone } = req.body;
        const newClient = new Client({ nom, prenom, adresse, email, telephone });
        const client = await newClient.save();
        //await sendClientMessage('creation', { id: client._id, nom, prenom, adresse, email, telephone });
        res.json(client);
    } catch (err) {
        res.status(500).send("Error while creating client: " + err.message);
    }
});

app.delete('/client/:id', async (req, res) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);
        if (!client) {
            return res.status(404).send("Client not found");
        }
        res.json({ message: "Client deleted successfully" });
    } catch (err) {
        res.status(500).send("Error while deleting client: " + err.message);
    }
});

app.put('/client/:id', async (req, res) => {
    try {
        const { nom, prenom, adresse, email, telephone } = req.body;
        const updatedClient = await Client.findByIdAndUpdate(req.params.id, { nom, prenom, adresse, email, telephone }, { new: true });
        if (!updatedClient) {
            return res.status(404).send("Client not found");
        }
        res.json(updatedClient);
    } catch (err) {
        res.status(500).send("Error while updating client: " + err.message);
    }
});

app.get('/room', async (req, res) => {
    try {
        const rooms = await Room.find();
        res.json(rooms);
    } catch (err) {
        res.status(500).send("Error while fetching rooms: " + err.message);
    }
});

app.post('/room', async (req, res) => {
    try {
        const { numero, type, status, prix, description } = req.body;
        const newRoom = new Room({ numero, type, status, prix, description });
        const room = await newRoom.save();
        res.json(room);
    } catch (err) {
        res.status(500).send("Error while creating room: " + err.message);
    }
});
app.put('/room/:id', async (req, res) => {
    try {
        const { numero, type, status, prix, description } = req.body;
        const updatedRoom = await Room.findByIdAndUpdate(req.params.id, { numero, type, status, prix, description }, { new: true });
        if (!updatedRoom) {
            return res.status(404).send("Room not found");
        }
        res.json(updatedRoom);
    } catch (err) {
        res.status(500).send("Error while updating room: " + err.message);
    }
});

app.delete('/room/:id', async (req, res) => {
    try {
        const room = await Room.findByIdAndDelete(req.params.id);
        if (!room) {
            return res.status(404).send("Room not found");
        }
        res.json({ message: "Room deleted successfully" });
    } catch (err) {
        res.status(500).send("Error while deleting room: " + err.message);
    }
});
app.get('/room/:id', async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).send("Room not found");
        }
        res.json(room);
    } catch (err) {
        res.status(500).send("Error while fetching room: " + err.message);
    }
});

app.put('/room/:id', async (req, res) => {
    try {
        const { numero, type, status, prix, description } = req.body;
        const updatedRoom = await Room.findByIdAndUpdate(req.params.id, { numero, type, status, prix, description }, { new: true });
        if (!updatedRoom) {
            return res.status(404).send("Room not found");
        }
        res.json(updatedRoom);
    } catch (err) {
        res.status(500).send("Error while updating room: " + err.message);
    }
});
app.get('/reservation', async (req, res) => {
    try {
        const reservations = await Reservation.find();
        res.json(reservations);
    } catch (err) {
        res.status(500).send("Error while fetching reservations: " + err.message);
    }
});
app.delete('/reservation/:id', async (req, res) => {
    try {
        const reservation = await Reservation.findByIdAndDelete(req.params.id);
        if (!reservation) {
            return res.status(404).send("Reservation not found");
        }
        res.json({ message: "Reservation deleted successfully" });
    } catch (err) {
        res.status(500).send("Error while deleting reservation: " + err.message);
    }
});

app.post('/reservation', async (req, res) => {
    try {
        const { client, room, dateStart, dateEnd } = req.body;

        const clientExists = await Client.exists({ _id: client });
        if (!clientExists) {
            return res.status(400).send("Client not found");
        }
        const roomData = await Room.findById(room);
        if (!roomData) {
            return res.status(400).send("Room not found");
        }
        if (roomData.status !== 'libre') {
            return res.status(400).send("Room is not available");
        }
        roomData.status = 'réservée';
        await roomData.save();
        const newReservation = new Reservation({ client, room, dateStart, dateEnd });
        const reservation = await newReservation.save();
        res.json(reservation);
    } catch (err) {
        res.status(500).send("Error while creating reservation: " + err.message);
    }
});

app.put('/reservation/:id', async (req, res) => {
    try {
        const { client, room, dateStart, dateEnd } = req.body;
        const updatedReservation = await Reservation.findByIdAndUpdate(req.params.id, { client: client, room: room, dateStart, dateEnd }, { new: true });
        if (!updatedReservation) {
            return res.status(404).send("Reservation not found");
        }
        res.json(updatedReservation);
    } catch (err) {
        res.status(500).send("Error while updating reservation: " + err.message);
    }
});

app.get('/reservation/:id', async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).send("Reservation not found");
        }
        res.json(reservation);
    } catch (err) {
        res.status(500).send("Error while fetching reservation: " + err.message);
    }
});

const port = 3000;
app.listen(port, () => {
    console.log(`API Gateway operational on port ${port}`);
});
