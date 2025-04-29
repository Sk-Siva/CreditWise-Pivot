import { createContext } from 'react';

const UserContext = createContext({
  userId: null,
  setUserId: () => {},
});

export default UserContext;