const { gql } = require('@apollo/server');
const typeDefs = `#graphql
  type Client {
    id: String!
    nom: String!
    prenom: String!
    adresse: String!
    email: String!
    telephone: String!
  }
  type Room {
    id: String!
    numero: String!
    type: String!
    status: String!
    prix: Float!
    description: String!
  }
  type Reservation {
    id: String!
    client: String!
    room: String!
    dateStart: String!
    dateEnd: String!
  }

  type Query {
    client(id: String!): Client
    clients: [Client]
    room(id: String!): Room
    rooms: [Room]
    reservation(id: String!): Reservation
    reservations: [Reservation]
  }

  type Mutation {
    createClient(nom: String!, prenom: String!, adresse: String!, email: String!, telephone: String!): Client
    createRoom(numero: String!, type: String!, status: String!, prix: Float!, description: String!): Room
    createReservation(client: String!, room: String!, dateStart: String!, dateEnd: String!): Reservation
    updateClient(id: ID!, nom: String!, prenom: String!, adresse: String!, email: String!, telephone: String!): Client
    updateRoom(id: ID!, numero: String!, type: String!, status: String!, prix: Float!, description: String!): Room
    updateReservation(id: ID!, client: ID!, room: ID!, dateStart: String!, dateEnd: String!): Reservation
    deleteClient(id: ID!): Client
    deleteRoom(id: ID!): Room
    deleteReservation(id: ID!):Reservation
  }
`;

module.exports = typeDefs;
