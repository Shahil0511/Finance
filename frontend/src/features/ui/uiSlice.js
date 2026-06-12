import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: { salesExporting: false, returnsExporting: false },
  reducers: {
    setSalesExporting(state, action)   { state.salesExporting   = action.payload; },
    setReturnsExporting(state, action) { state.returnsExporting = action.payload; },
  },
});

export const { setSalesExporting, setReturnsExporting } = uiSlice.actions;
export const selectSalesExporting   = (s) => s.ui.salesExporting;
export const selectReturnsExporting = (s) => s.ui.returnsExporting;
export default uiSlice.reducer;
