import { v4 as uuidv4 } from 'uuid';

// In-memory store for Alerts
class AlertStore {
  private alerts: any[] = [];

  async find(query: any = {}) {
    let results = [...this.alerts];
    if (query.status) {
      results = results.filter(a => a.status === query.status);
    }
    return {
      sort: () => ({
        limit: (n: number) => results.slice(0, n)
      }),
      limit: (n: number) => results.slice(0, n)
    };
  }

  async findById(id: string) {
    return this.alerts.find(a => a._id === id || a.id === id);
  }

  async findOne(query: any) {
    if (query['source.reference']) {
      return this.alerts.find(a => a.source?.reference === query['source.reference']);
    }
    return null;
  }

  async save(alertData: any) {
    const newAlert = {
      _id: alertData._id || uuidv4(),
      createdAt: new Date(),
      status: 'active',
      ...alertData
    };
    // Mock Mongoose .save() behavior
    newAlert.save = async () => true;
    this.alerts.unshift(newAlert);
    // Keep max 500 alerts in memory
    if (this.alerts.length > 500) this.alerts.pop();
    return newAlert;
  }
}

// In-memory store for Users
class UserStore {
  private users: any[] = [
    {
      _id: 'demo-user-123',
      email: 'demo@crisisiq.ai',
      role: 'admin',
      profile: { name: 'Demo Admin' },
      isVerified: true
    }
  ];

  async findOne(query: any) {
    const user = this.users.find(u => u.email === query.email);
    if (user) {
      return {
        ...user,
        select: () => user,
        comparePassword: async () => true, // Demo: any password works
        save: async () => true,
        toObject: () => user
      };
    }
    return null;
  }

  async findById(id: string) {
    return this.users.find(u => u._id === id);
  }

  async create(userData: any) {
    const newUser = {
      _id: uuidv4(),
      ...userData,
      toObject: () => newUser
    };
    this.users.push(newUser);
    return newUser;
  }
}

export const alertStore = new AlertStore();
export const userStore = new UserStore();
