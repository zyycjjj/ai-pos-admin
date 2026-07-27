export type StoreRole = 'OWNER' | 'MANAGER' | 'CASHIER' | 'KITCHEN' | 'STAFF';

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
};

export type AuthStore = {
  storeId: string;
  storeName: string;
  role: StoreRole;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
  stores: AuthStore[];
  activeStoreId: string;
  role: StoreRole;
  permissions: string[];
};
