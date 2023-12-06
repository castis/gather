import React, { useCallback, useEffect, useRef, useState } from "react";
import { DateTime } from "luxon";

// can useSetTitle("new title") or useSetTitle((oldTitle) => `${oldTitle} - new title`)
// you can also
// const setTitle = useSetTitle();
// and then setTitle("new title") or setTitle((oldTitle) => `${oldTitle} - new title`)
// as many times as you want and the title will reset on unmount
export const useSetTitle = (initialUpdate) => {
  const originalTitle = useRef(document.title);

  const updateTitle = useCallback((newTitle) => {
    document.title =
      typeof newTitle === "function"
        ? newTitle(originalTitle.current)
        : newTitle;
  }, []);

  useEffect(() => {
    if (initialUpdate) updateTitle(initialUpdate);
    // when the component unmounts, reset the title
    return () => (document.title = originalTitle.current);
  }, [initialUpdate, updateTitle]);

  return updateTitle;
};

export const useErrorHandler = (defaultFieldName = "global") => {
  const [errors, setErrors] = useState({});

  const handleApiError = (error) => {
    console.error(error);
    const { response } = error;

    if (response?.status === 401) {
      setErrors({ [defaultFieldName]: "Not allowed" });
    } else if (response?.status === 403) {
      setErrors({ [defaultFieldName]: "Banned" });
    } else if (response?.status === 422) {
      const { data } = response;
      setErrors({
        ...data?.json,
        ...data?.form,
        ...data?.files,
      });
    } else if (response?.status === 429) {
      setErrors({ [defaultFieldName]: response?.data || "Too many requests" });
    } else {
      setErrors({ [defaultFieldName]: "an error occurred" });
    }
  };

  return [errors, setErrors, handleApiError];
};

export const loadDatetime = (ISO8601) =>
  DateTime.fromISO(ISO8601, { zone: "UTC" });

const suffixes = ["th", "st", "nd", "rd"];
export const ordinal = (num) => {
  const val = num % 100;
  return num + (suffixes[(val - 20) % 10] || suffixes[val] || suffixes[0]);
};

// 2023-11-08T12:31:10.140428 to "January 6th 2011"
export const formatDate = (date) => {
  const d = new Date(date);
  const month = d.toLocaleString("default", { month: "long" });
  return `${month} ${ordinal(d.getDate())}, ${d.getFullYear()}`;
};
