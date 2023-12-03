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
      if (data?.comments?.total > comment_count) {
        setNewCount(data.comments.total - comment_count);
      }
    },
    [comment_count]
  );

  const handleError = useCallback((error) => {
    // console.error(error);
    stop();
  }, []);

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
        .catch(handleError);
    }, 3000);

    return () => clearInterval(interval);
  }, [slug]);

  return [newCount, reset, stop];
};

export default useNotifier;
