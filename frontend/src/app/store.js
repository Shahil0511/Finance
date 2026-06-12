import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import uiReducer            from '../features/ui/uiSlice';
import notificationsReducer from '../features/notifications/notificationsSlice';
import { salesApi }         from '../features/sales/salesApi';
import { returnsApi }       from '../features/returns/returnsApi';
import rootSaga             from './rootSaga';

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: {
    ui:                          uiReducer,
    notifications:               notificationsReducer,
    [salesApi.reducerPath]:      salesApi.reducer,
    [returnsApi.reducerPath]:    returnsApi.reducer,
  },
  middleware: (getDefault) =>
    getDefault()
      .concat(sagaMiddleware)
      .concat(salesApi.middleware)
      .concat(returnsApi.middleware),
});

sagaMiddleware.run(rootSaga);
export default store;
