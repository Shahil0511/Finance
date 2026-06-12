import { createSlice } from '@reduxjs/toolkit';

let _id = 1;

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: { items: [] },
  reducers: {
    addNotification(state, action) {
      state.items.push({ id: _id++, type: 'info', duration: 4000, ...action.payload });
    },
    removeNotification(state, action) {
      state.items = state.items.filter((n) => n.id !== action.payload);
    },
  },
});

export const { addNotification, removeNotification } = notificationsSlice.actions;
export const selectNotifications = (s) => s.notifications.items;
export default notificationsSlice.reducer;
