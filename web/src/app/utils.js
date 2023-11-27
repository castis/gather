import { DateTime } from "luxon";

import { useState } from "react";

export const useSingleErrorHandler = () => {
  const [error, setError] = useState(null);

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
  }

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
      setErrors({
        ...response.data?.json,
        ...response.data?.form,
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
  DateTime.fromISO(ISO8601, {
    zone: "UTC",
  });

export const ordinal = (n) => {
  const s = ["th", "st", "nd", "rd"],
    v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

// 2023-11-08T12:31:10.140428 to "January 6th 2011"
export const formatDate = (date) => {
  const d = new Date(date);
  return `${d.toLocaleString("default", { month: "long" })} ${ordinal(
    d.getDate()
  )}, ${d.getFullYear()}`;
};

// https://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format
// String.prototype.formatUnicorn =
//   String.prototype.formatUnicorn ||
//   function () {
//     "use strict";
//     var str = this.toString();
//     if (arguments.length) {
//       var t = typeof arguments[0];
//       var key;
//       var args =
//         "string" === t || "number" === t
//           ? Array.prototype.slice.call(arguments)
//           : arguments[0];

//       for (key in args) {
//         str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
//       }
//     }

//     return str;
//   };
