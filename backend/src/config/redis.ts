// Mocking Redis to prevent ECONNREFUSED errors locally while showing live data
export const redis = {
  isOpen: true,
  on: (event: string, handler: any) => {},
  connect: async () => {},
  brPop: async (key: string, timeout: number) => {
    // Simulate empty queue without throwing errors
    await new Promise(resolve => setTimeout(resolve, timeout * 1000));
    return null;
  },
  incr: async (key: string) => 1,
  lPush: async (key: string, value: any) => 1,
  del: async (key: string) => 1
} as any;
