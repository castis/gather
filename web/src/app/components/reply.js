import React, { useState, useEffect } from "react";
import { useSetRecoilState } from "recoil";

import { replyTextState } from "../atoms";
import { api } from "../api";
import { TextEditor } from "./texteditor";

export const Reply = ({ thread, onUpdateData }) => {
  const setText = useSetRecoilState(replyTextState);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  // useEffect(() => {
  //   if (window.location.hash == "#bottom" && textareaRef?.current) {
  //     textareaRef.current.scrollIntoView({
  //       behavior: "smooth",
  //       block: "center",
  //     });
  //   }
  // }, [window.location.hash, textareaRef?.current]);

  if (!thread.enabled) {
    return <h3 className="reply-form">This thread is closed.</h3>
  }

  const onSend = (e) => {
    e.preventDefault();
    setError("");
    setWorking(true);

    const form = Object.fromEntries(new FormData(e.target).entries());
    form.slug = thread.slug;

    api
      .post("/threads/detail", form)
      .then((response) => {
        onUpdateData(response);
        setText("");
        setWorking(false);
      })
      .catch(({ response }) => {
        if (response?.data?.json?.content) {
          setError(response.data.json.content);
        } else {
          setError("Something went wrong.");
        }
        setWorking(false);
      });
  };

  return (
    <form onSubmit={onSend} className="reply-form">
      <TextEditor working={working} />
    </form>
  );
};
