import { alertStore } from '../config/memoryStore.js';

export const resolvers = {
  Query: {
    alerts: async (_: any, { limit = 50, severity }: any) => {
      const queryArr = await (await alertStore.find(severity ? { severity } : {}));
      return queryArr.limit(limit);
    },
    alert: async (_: any, { id }: any) => {
      return await alertStore.findById(id);
    }
  }
};
