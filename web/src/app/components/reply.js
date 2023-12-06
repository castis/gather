import React, { useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";
import { useParams } from "react-router";
import { api } from "../api";
import { replyTextState, userState } from "../atoms";
import { TextEditor } from "./texteditor";

import React, { useCallback, useRef } from "react";

import { useRecoilValue, useRecoilState } from "recoil";
import { threadState, commentsState, globalKeyState } from "../atoms";
import { useSetTitle, useErrorHandler } from "../utils";

import closeImg from "url:/src/images/chrome/close.gif";
import p09 from "url:/src/images/pinkies/09.gif";
import p25 from "url:/src/images/pinkies/25.gif";
import { Link, useNavigate } from "react-router-dom";

const NewPostNotifier = () => {
  const { slug, comment_count } = useRecoilValue(threadState);
  const { comments_per_page } = useRecoilValue(userState);
  const setGlobalKey = useSetRecoilState(globalKeyState);

  const [newCount, setNewCount] = useState(0);
  const keepPolling = useRef(true);
  const setTitle = useSetTitle();

  const stop = useCallback((e) => {
    keepPolling.current = false;
    setNewCount(0);
  });

  const handleResponse = useCallback(
    ({ data }) => {
      if (data?.comments?.total > comment_count) {
        const outgoingCount = data.comments.total - comment_count;
        setNewCount(outgoingCount);
        setTitle((p) => `${outgoingCount} new posts - ${p}`);
      }
    },
    [comment_count]
  );

  const reset = useCallback(() => setGlobalKey(Math.random()));

  useEffect(() => {
    let interval = setInterval(() => {
      if (!keepPolling.current) {
        clearInterval(interval);
        return;
      }

      api.post(`/threads/ping`, { slug }).then(handleResponse).catch(stop);
    }, 15000);

    return () => clearInterval(interval);
  }, [slug]);

  if (!newCount) {
    return null;
  }

  const page = Math.ceil(comment_count / comments_per_page);
  return (
    <div className="new-comments">
      <img src={p25} />
      <Link to={`/thread/${slug}/${page}/#bottom`} onClick={reset}>
        {newCount} new post{newCount > 1 ? "s" : ""} added
      </Link>
      <img src={closeImg} className="close" onClick={stop} />
    </div>
  );
};

export const Reply = () => {
  const { page } = useParams();
  const [thread, setThread] = useRecoilState(threadState);
  const [comments, setComments] = useRecoilState(commentsState);
  const setText = useSetRecoilState(replyTextState);
  const [errors, setErrors, handleApiError] = useErrorHandler("content");
  const [working, setWorking] = useState(false);
  const navigate = useNavigate();

  if (!thread.enabled) {
    return (
      <div className="closed">
        This thread is closed.
        <img src={p09} />
      </div>
    );
  }

  const onSend = (e) => {
    e.preventDefault();
    setErrors({});
    setWorking(true);

    const form = Object.fromEntries(new FormData(e.target).entries());
    form.slug = thread.slug;

    api
      .post("/threads/detail", form)
      .then(({ data }) => {
        if (data.comments.page != page) {
          navigate(`/thread/${thread.slug}/${data.comments.page}#bottom`);
        } else {
          setThread(data.thread);
          setComments(data.comments);
        }

        setText("");
      })
      .catch(handleApiError)
      .finally(() => setWorking(false));
  };

  return (
    <>
      <form onSubmit={onSend} className="reply-form">
        <TextEditor working={working} errors={errors} />
      </form>

      <NewPostNotifier />
    </>
  );
};
