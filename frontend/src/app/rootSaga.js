import { all } from 'redux-saga/effects';
import { salesSagas }   from '../features/sales/salesSaga';
import { returnsSagas } from '../features/returns/returnsSaga';

export default function* rootSaga() {
  yield all([salesSagas(), returnsSagas()]);
}
