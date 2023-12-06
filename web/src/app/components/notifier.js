import React, { useEffect, useState, useCallback, useRef } from "react";

import { api } from "../api";
import { useRecoilValue } from "recoil";
import { threadState } from "../atoms";

const useNotifier = () => {
  const { slug, comment_count } = useRecoilValue(threadState);
  const [newCount, setNewCount] = useState(0);
  const keepPolling = useRef(true);

  const stop = useCallback((e) => {
    keepPolling.current = false;
  });

  const handleResponse = useCallback(
    ({ data }) => {
      // if data is a number and it's greater than the current comment count
      if (typeof data === "number" && data > comment_count) {
        setNewCount(data - comment_count);
      }
    },
    [comment_count]
  );

  const reset = useCallback(() => setNewCount(0));

  useEffect(() => {
    let interval = setInterval(() => {
      if (!keepPolling.current) {
        clearInterval(interval);
        return;
      }

      api
        .post(`/threads/ping`, { slug })
        .then(handleResponse)
        .catch(stop);
    }, 15000);

    return () => clearInterval(interval);
  }, [slug]);

  return [newCount, reset, stop];
};

export default useNotifier;
