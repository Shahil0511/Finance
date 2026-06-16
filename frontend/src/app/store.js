import { configureStore } from '@reduxjs/toolkit';
import { salesApi }   from '../features/sales/salesApi';
import { returnsApi } from '../features/returns/returnsApi';

const store = configureStore({
  reducer: {
    [salesApi.reducerPath]:   salesApi.reducer,
    [returnsApi.reducerPath]: returnsApi.reducer,
  },
  middleware: (getDefault) =>
    getDefault()
      .concat(salesApi.middleware)
      .concat(returnsApi.middleware),
});

export default store;
