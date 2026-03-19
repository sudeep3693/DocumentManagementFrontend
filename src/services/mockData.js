// Mock users database
let users = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@docman.com',
    password: 'admin123',
    role: 'admin',
    status: 'approved',
    phone: '',
    organization: 'DocMan Inc.',
    address: 'Admin HQ',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'user123',
    role: 'user',
    status: 'approved',
    phone: '9800000001',
    organization: 'Acme Corp',
    address: '123 Main St',
    createdAt: '2026-02-15T00:00:00Z',
  },
  {
    id: '3',
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'user123',
    role: 'user',
    status: 'pending',
    phone: '9800000002',
    organization: 'Beta Ltd',
    address: '456 Oak Ave',
    createdAt: '2026-03-01T00:00:00Z',
  },
  {
    id: '4',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    password: 'user123',
    role: 'user',
    status: 'pending',
    phone: '',
    organization: '',
    address: '',
    createdAt: '2026-03-10T00:00:00Z',
  },
  {
    id: '5',
    name: 'Sara Williams',
    email: 'sara@example.com',
    password: 'user123',
    role: 'user',
    status: 'rejected',
    phone: '9800000003',
    organization: 'Gamma Inc',
    address: '789 Pine Rd',
    createdAt: '2026-03-05T00:00:00Z',
  },
];

// Mock clients database
let clients = [
  {
    id: 'c1',
    userId: '2',
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    phone: '9801234567',
    address: '100 Business Ave, New York',
    industry: 'Technology',
    createdAt: '2026-02-20T00:00:00Z',
  },
  {
    id: 'c2',
    userId: '2',
    name: 'GlobalTech Solutions',
    email: 'info@globaltech.com',
    phone: '9807654321',
    address: '200 Tech Park, San Francisco',
    industry: 'Software',
    createdAt: '2026-02-25T00:00:00Z',
  },
  {
    id: 'c3',
    userId: '2',
    name: 'Green Energy Ltd',
    email: 'hello@greenenergy.com',
    phone: '9809876543',
    address: '300 Solar Blvd, Austin',
    industry: 'Energy',
    createdAt: '2026-03-01T00:00:00Z',
  },
];

let nextUserId = 6;
let nextClientId = 4;

export const getUsers = () => [...users];

export const getUserById = (id) => users.find((u) => u.id === id) || null;

export const getUserByEmail = (email) => users.find((u) => u.email === email) || null;

export const addUser = (userData) => {
  const newUser = {
    id: String(nextUserId++),
    ...userData,
    role: 'user',
    status: 'new',
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  return newUser;
};

export const updateUser = (id, updates) => {
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return null;
  users[index] = { ...users[index], ...updates };
  return users[index];
};

export const getClients = (userId) => clients.filter((c) => c.userId === userId);

export const getClientById = (id) => clients.find((c) => c.id === id) || null;

export const addClient = (clientData) => {
  const newClient = {
    id: `c${nextClientId++}`,
    ...clientData,
    createdAt: new Date().toISOString(),
  };
  clients.push(newClient);
  return newClient;
};

export const updateClient = (id, updates) => {
  const index = clients.findIndex((c) => c.id === id);
  if (index === -1) return null;
  clients[index] = { ...clients[index], ...updates };
  return clients[index];
};

export const deleteClient = (id) => {
  const index = clients.findIndex((c) => c.id === id);
  if (index === -1) return false;
  clients.splice(index, 1);
  return true;
};
