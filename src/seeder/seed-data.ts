export const modules = [
  { name: 'Auth', description: 'Authentication and authorization' },
  { name: 'Users', description: 'User management' },
  { name: 'Roles', description: 'Role management' },
  { name: 'Modules', description: 'Module listing' },
  { name: 'Api Endpoints', description: 'API endpoint listing' },
];

export const endpointDefinitions: {
  moduleName: string;
  method: string;
  path: string;
  name: string;
}[] = [
  { moduleName: 'Auth', method: 'POST', path: '/api/auth/login', name: 'Login' },
  { moduleName: 'Auth', method: 'GET', path: '/api/auth/profile', name: 'Get Profile' },

  { moduleName: 'Users', method: 'GET', path: '/api/users', name: 'List Users' },
  { moduleName: 'Users', method: 'GET', path: '/api/users/:id', name: 'Get User' },
  { moduleName: 'Users', method: 'POST', path: '/api/users', name: 'Create User' },
  { moduleName: 'Users', method: 'PATCH', path: '/api/users/:id', name: 'Update User' },
  { moduleName: 'Users', method: 'PATCH', path: '/api/users/:id/status', name: 'Toggle User Status' },
  { moduleName: 'Users', method: 'POST', path: '/api/users/:id/endpoints', name: 'Assign User Endpoints' },
  { moduleName: 'Users', method: 'POST', path: '/api/users/:id/modules', name: 'Assign User Modules' },

  { moduleName: 'Roles', method: 'GET', path: '/api/roles', name: 'List Roles' },
  { moduleName: 'Roles', method: 'GET', path: '/api/roles/:id', name: 'Get Role' },
  { moduleName: 'Roles', method: 'POST', path: '/api/roles', name: 'Create Role' },
  { moduleName: 'Roles', method: 'PATCH', path: '/api/roles/:id', name: 'Update Role' },
  { moduleName: 'Roles', method: 'DELETE', path: '/api/roles/:id', name: 'Delete Role' },
  { moduleName: 'Roles', method: 'POST', path: '/api/roles/:id/endpoints', name: 'Assign Role Endpoints' },
  { moduleName: 'Roles', method: 'POST', path: '/api/roles/:id/modules', name: 'Assign Role Modules' },

  { moduleName: 'Modules', method: 'GET', path: '/api/modules', name: 'List Modules' },

  { moduleName: 'Api Endpoints', method: 'GET', path: '/api/api-endpoints', name: 'List All Endpoints' },
  { moduleName: 'Api Endpoints', method: 'GET', path: '/api/api-endpoints/by-module/:id', name: 'Endpoints By Module' },
];
