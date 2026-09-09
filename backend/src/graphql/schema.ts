export const typeDefs = `#graphql
  type Location {
    type: String
    coordinates: [Float]
    region: String
  }

  type Source {
    type: String
    reference: String
    confidence: Float
  }

  type Alert {
    id: ID!
    title: String!
    description: String
    type: String
    severity: String
    location: Location
    source: Source
    createdAt: String
  }

  type Query {
    alerts(limit: Int, severity: String): [Alert]
    alert(id: ID!): Alert
  }
`;
