import { useCallback, useEffect, useRef, useState } from 'react';

export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: undefined, loading: true, error: null });
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fnRef.current()
      .then((data) => !cancelled && setState({ data, loading: false, error: null }))
      .catch((error) => !cancelled && setState((s) => ({ ...s, loading: false, error })));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps do nơi gọi truyền vào
  }, deps);

  useEffect(() => run(), [run]);
  return { ...state, reload: run };
}
