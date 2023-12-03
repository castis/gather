import React, { useState } from "react";
import { DateTime } from "luxon";

export const useSingleErrorHandler = () => {
  const [error, setError] = useState();

  const handleApiError = (error) => {
    console.error(error);
    const { response } = error;

    if (response?.status === 401) {
      setError("Not allowed");
    } else if (response?.status === 403) {
      setError("Banned");
    } else if (response?.status === 422) {
      setError(response.data?.json || response.data?.form);
    } else if (response?.status === 429) {
      setError(response?.data || "Too many requests");
    } else {
      setError("Something didn't go right");
    }
  };

  return [error, setError, handleApiError];
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
      setErrors({ [defaultFieldName]: "Something didn't go right" });
    }
  };

  return [errors, setErrors, handleApiError];
};

export const loadDatetime = (ISO8601) =>
  DateTime.fromISO(ISO8601, { zone: "UTC" });

export const ordinal = (n) => {
  const s = ["th", "st", "nd", "rd"],
    v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

// 2023-11-08T12:31:10.140428 to "January 6th 2011"
export const formatDate = (date) => {
  const d = new Date(date);
  const month = d.toLocaleString("default", { month: "long" });
  return `${month} ${ordinal(d.getDate())}, ${d.getFullYear()}`;
};
