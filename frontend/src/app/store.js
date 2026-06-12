import { configureStore } from '@reduxjs/toolkit';
import notificationsReducer from '../features/notifications/notificationsSlice';
import { salesApi }   from '../features/sales/salesApi';
import { returnsApi } from '../features/returns/returnsApi';

export const store = configureStore({
  reducer: {
    notifications:            notificationsReducer,
    [salesApi.reducerPath]:   salesApi.reducer,
    [returnsApi.reducerPath]: returnsApi.reducer,
  },
  middleware: (getDefault) =>
    getDefault()
      .concat(salesApi.middleware)
      .concat(returnsApi.middleware),
});

export default store;
