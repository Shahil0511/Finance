import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { markForcedRefresh } from '../lib/refreshBus';

// Drives the header Refresh control: marks the forced-refresh window, invalidates
// the report's RTK tag (so every query for it refetches from the DB, bypassing the
// Redis read), and stays "refreshing" — spinning icon + loading toast — until the
// report's list query finishes refetching.
export function useReportRefresh(api, tag, isFetching) {
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const wasFetching = useRef(false);
  const toastId = useRef(null);

  useEffect(() => {
    if (refreshing && wasFetching.current && !isFetching) {
      setRefreshing(false);
      if (toastId.current != null) {
        toast.success('Data refreshed', { id: toastId.current });
        toastId.current = null;
      }
    }
    wasFetching.current = isFetching;
  }, [isFetching, refreshing]);

  const refresh = () => {
    markForcedRefresh();
    dispatch(api.util.invalidateTags(tag));
    setRefreshing(true);
    toastId.current = toast.loading('Refreshing data…');
  };

  return { refreshing, refresh };
}
