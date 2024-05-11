const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDB = require('./config/database');
const Client = require('./models/clientModel');
const Room = require('./models/roomModel');
const Reservation = require('./models/reservationModel');
const protoLoader = require('@grpc/proto-loader');
const grpc = require('@grpc/grpc-js');
const { sendClientMessage } = require('./kafka/clientProducer');
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
const roomProtoPath = './proto/room.proto';
const roomProtoDefinition = protoLoader.loadSync(roomProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const roomProto = grpc.loadPackageDefinition(roomProtoDefinition).room;
const RoomService = new roomProto.RoomService('localhost:50055', grpc.credentials.createInsecure());

app.use(cors());
app.use(bodyParser.json());
//routes grpc room
app.post('/grpc/rooms', (req, res) => {
    const { numero, type, status, prix, description } = req.body;
    RoomService.createRoom({ numero, type, status, prix, description }, (err, response) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(response.room);
    });
  });
  
  app.get('/grpc/rooms/:id', (req, res) => {
    const roomId = req.params.id;
    RoomService.getRoom({ room_id: roomId }, (err, response) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(response.room);
    });
  });
  
  app.put('/grpc/rooms/:id', (req, res) => {
    const roomId = req.params.id;
    const { numero, type, status, prix, description } = req.body;
    RoomService.updateRoom({ room_id: roomId, numero, type, status, prix, description }, (err, response) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(response.room);
    });
  });
  
  app.get('/grpc/rooms', (req, res) => {
    RoomService.getAllRooms({}, (err, response) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(response.rooms);
    });
  });
  
// Suppression d'une chambre avec suppression des réservations associées et mise à jour du statut des chambres
app.delete('/grpc/rooms/:id', (req, res) => {
  const roomId = req.params.id;
  RoomService.deleteRoom({ room_id: roomId }, async (err, response) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Supprimer toutes les réservations associées à cette chambre
    try {
      await Reservation.deleteMany({ room: roomId });
      res.json({ message: "Room and associated reservations deleted successfully" });
    } catch (err) {
      res.status(500).send("Error while deleting room and associated reservations: " + err.message);
    }
  });
});

// Route pour récupérer une réservation
app.get('/grpc/reservation/:id', (req, res) => {
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
  app.post('/grpc/reservation', async (req, res) => {
    try {
        const { client, room, dateStart, dateEnd } = req.body;
        const clientData = await Client.findOne({ _id: client });
        if (!clientData) {
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


  
  // Route pour mettre à jour une réservation
  app.put('/grpc/reservation/:id', (req, res) => {
    const reservationId = req.params.id;
    const { client, room, dateStart, dateEnd } = req.body;
    ReservationService.updateReservation({ reservation_id: reservationId, client, room, dateStart, dateEnd }, (err, response) => {
      if (err) {
        res.status(500).send("Error while updating reservation: " + err.message);
        return;
      }
      res.json(response.reservation);
    });
  });
  
  // Route pour supprimer une réservation
  app.delete('/grpc/reservation/:id', async (req, res) => {
    const reservationId = req.params.id;
    try {
      const reservation = await Reservation.findById(reservationId);
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }
  
      const room = await Room.findById(reservation.room);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      room.status = 'libre'; 
      await room.save();
  
      await Reservation.findByIdAndDelete(reservationId);
  
      res.json({ message: "Reservation deleted successfully" });
    } catch (err) {
      res.status(500).send("Error while deleting reservation: " + err.message);
    }
  });
  
  
  // Route pour récupérer toutes les réservations
  app.get('/grpc/reservation', (req, res) => {
    ReservationService.getAllReservations({}, (err, response) => {
      if (err) {
        res.status(500).send("Error while fetching all reservations: " + err.message);
        return;
      }
      res.json(response.reservations);
    });
  });

// Routes gRPC pour les clients
app.post('/grpc/client', async (req, res) => {
  try {
    const response = await new Promise((resolve, reject) => {
      client.createClient(req.body, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
    await sendClientMessage('creation', { id: response.client.id, ...req.body }); 
    res.json(response.client);
  } catch (error) {
    res.status(500).send("Error while creating client: " + error.message);
  }
});
  
app.put('/grpc/client/:id', async (req, res) => {
  try {
    const requestData = Object.assign({}, req.body, { client_id: req.params.id });
    const response = await new Promise((resolve, reject) => {
      client.updateClient(requestData, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
    await sendClientMessage('modification', { id: req.params.id, ...req.body }); // Envoyer un message Kafka lors de la modification d'un client
    res.json(response.client);
  } catch (error) {
    res.status(500).send("Error while updating client: " + error.message);
  }
});
  
app.get('/grpc/client', async (req, res) => {
  try {
    client.getAllClients({}, async (err, response) => {
      if (err) {
        res.status(500).send("Error while fetching all clients: " + err.message);
        return;
      }
      await sendClientMessage('recuperation_tous', {});
      res.json(response.clients);
    });
  } catch (error) {
    res.status(500).send("Error while fetching all clients: " + error.message);
  }
});

app.get('/grpc/client/:id', async (req, res) => {
  try {
    client.getClient({ client_id: req.params.id }, async (err, response) => {
      if (err) {
        res.status(500).send("Error while fetching client: " + err.message);
        return;
      }
      await sendClientMessage('recuperation', { clientId: req.params.id });
      res.json(response.client);
    });
  } catch (error) {
    res.status(500).send("Error while fetching client: " + error.message);
  }
});

  
// Suppression d'un client avec suppression des réservations associées et mise à jour du statut des chambres
app.delete('/grpc/client/:id', (req, res) => {
  const client_id = req.params.id;
  client.deleteClient({ client_id }, async (err, response) => {
    if (err) {
      res.status(500).send("Error while deleting client: " + err.message);
      return;
    }
    try {
      const reservations = await Reservation.find({ client: client_id });

      for (const reservation of reservations) {
        const room = await Room.findById(reservation.room);
        if (room) {
          room.status = 'libre';
          await room.save();
        }
      }

      await Reservation.deleteMany({ client: client_id });
      await sendClientMessage('suppression', { id: req.params.id });

      res.json({ message: "Client and associated reservations deleted successfully" });
    } catch (err) {
      res.status(500).send("Error while deleting client and associated reservations: " + err.message);
    }
  });
});




  
  //route rest
app.get('/client', async (req, res) => {
    try {
        const clients = await Client.find();
        res.json(clients);
        await sendClientMessage('recuperation_tous', {});
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
        await sendClientMessage('recuperation', { clientId: req.params.id });
    } catch (err) {
        res.status(500).send("Error while fetching client: " + err.message);
    }
});

app.post('/client', async (req, res) => {
    try {
        const { nom, prenom, adresse, email, telephone } = req.body;
        const newClient = new Client({ nom, prenom, adresse, email, telephone });
        const client = await newClient.save();
        await sendClientMessage('creation', { id: client._id, nom, prenom, adresse, email, telephone });
        res.json(client);
    } catch (err) {
        res.status(500).send("Error while creating client: " + err.message);
    }
});

app.delete('/client/:id', async (req, res) => {
  try {
      const client = await Client.findById(req.params.id);
      if (!client) {
          return res.status(404).send("Client not found");
      }

      // Trouver toutes les réservations liées à ce client
      const reservations = await Reservation.find({ client: req.params.id });

      // Pour chaque réservation, mettre à jour le statut de la chambre à "libre"
      for (const reservation of reservations) {
          const room = await Room.findById(reservation.room);
          if (room) {
              room.status = 'libre';
              await room.save();
          }
      }

      // Supprimer toutes les réservations liées à ce client
      await Reservation.deleteMany({ client: req.params.id });

      // Supprimer le client lui-même
      await Client.findByIdAndDelete(req.params.id);
      await sendClientMessage('suppression', { id: req.params.id });
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
        await sendClientMessage('modification', { id: updatedClient._id, nom, prenom, adresse, email, telephone }); 
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
      const room = await Room.findById(req.params.id);
      if (!room) {
          return res.status(404).send("Room not found");
      }

      await Reservation.deleteMany({ room: req.params.id });

      await Room.updateMany({ _id: { $ne: req.params.id } }, { $set: { status: 'libre' } });

      await Room.findByIdAndDelete(req.params.id);

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

    const room = await Room.findById(reservation.room);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    room.status = 'libre';
    await room.save();

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
