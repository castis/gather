import React, { useCallback, useEffect, useState } from "react";
import { camelCase, startCase } from "lodash";
import { useParams } from "react-router";
import { Link, useNavigate } from "react-router-dom";
import {
  atom,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from "recoil";
import styled from "styled-components";

import { api } from "../api";
import { globalKeyState, replyTextState, userState } from "../atoms";
import Pagination from "../components/pagination";
import { Reply } from "../components/reply";
import { Content, Error, Skeleton, Stage, Title } from "../components/stage";
import { pinkies } from "../components/texteditor";
import { avatarLocation } from "../config";
import { loadDatetime, useErrorHandler, useSetTitle } from "../utils";
import {
  threadState,
  commentsState,
  userState,
  globalKeyState,
} from "../atoms";

import p05 from "url:/src/images/pinkies/05.gif";

const unitsMap = [
  { unit: "years", single: "year" },
  { unit: "months", single: "month" },
  { unit: "weeks", single: "week" },
  { unit: "days", single: "day" },
  // { unit: "hours", single: "hour" },
  // { unit: "minutes", single: "minute" },
  // { unit: "seconds", single: "second" },
];

const units = [
  "years",
  "months",
  "weeks",
  "days",
  // "hours",
  // "minutes",
  // "seconds",
];

function timeDifference(start, end) {
  let diff = end.diff(start);
  if (diff.as("hours") < 12) return;
  diff = diff.shiftTo(...units);
  const output = units.reduce((acc, unit) => {
    const value = Math.round(diff.get(unit));
    if (value > 0) {
      acc.push(`${value} ${value === 1 ? unit.slice(0, -1) : unit}`);
    }
    return acc;
  }, []);

  if (output.length > 0) return output.join(", ") + " later";
}

const Thread = () => {
  const params = useParams();

  const globalKey = useRecoilValue(globalKeyState);
  const user = useRecoilValue(userState);
  const [thread, setThread] = useRecoilState(threadState);
  const [comments, setComments] = useRecoilState(commentsState);

  const [working, setWorking] = useState(true);
  const [errors, setErrors, handleApiError] = useErrorHandler();
  const navigate = useNavigate();

  useSetTitle((p) => `${p} - ${thread.title}`);

  const slug = params.slug;
  const page = params.page || 1;

  useEffect(() => {
    setWorking(true);
    setErrors({});

    api
      .get(`/threads/detail`, { params: { slug, page } })
      .then(({ data }) => {
        setThread(data.thread);
        setComments(data.comments);
      })
      .catch(handleApiError)
      .finally(() => setWorking(false));
  }, [globalKey, slug, page]);

  if (errors?.global) {
    return <Error title="There's not much to see here" errors={errors} />;
  }

  if (working || !thread?.id) {
    return <Skeleton />;
  }

  const paging = (
    <Pagination
      items={comments}
      plural="comments"
      path={`/thread/${slug}`}
      cta={thread.author.id == user.id && <Admin />}
    >
      in <Link to="/">Threads</Link> &gt;{" "}
      <Link to={`/category/${thread.category}`}>
        {startCase(camelCase(thread.category))}
      </Link>{" "}
      &gt; <Link to={`/thread/${thread.slug}`}>{thread.title}</Link>
    </Pagination>
  );

  return (
    <Stage>
      <Title>{thread?.title}</Title>
      <StyledThread>
        {paging}
        <div className="comments">
          {comments?.items?.map((comment, i) => {
            const nextComment = comments.items[i + 1];
            const timeDiffMessage = nextComment
              ? timeDifference(
                  loadDatetime(comment.created_at),
                  loadDatetime(nextComment.created_at)
                )
              : null;

            return (
              <React.Fragment key={comment.id}>
                <Comment comment={comment} />
                {timeDiffMessage && (
                  <div className="time-difference">{timeDiffMessage}</div>
                )}
              </React.Fragment>
            );
          })}
        </div>
        {paging}

        <Reply />
      </StyledThread>
    </Stage>
  );
};

const StyledThread = styled(Content)`
  .admin {
    margin-left: auto;
    display: flex;
    flex-direction: row;
    align-items: center;
    list-style: none;
    gap: 10px;

    li {
      color: #494949;
      background-color: #e6f7fe;
      padding: 4px;
      text-transform: uppercase;
      text-align: center;
      font-size: 9px;
      margin-left: auto;
      cursor: pointer;

      &:hover {
        background-color: #494949;
        color: #e6f7fe;
      }
    }
  }

  .time-difference {
    border-bottom: solid 1px #ccc;
    text-align: center;
    font-size: 9px;
    padding: 2px;
    color: #aaa;
    background: #eee;
  }

  .reply-form {
    margin-top: 15px;
  }

  .closed {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;

    margin-top: 15px;
    padding: 15px;

    background: #ffeaea;
    color: #8a8a8a;
    font-size: 12px;

    img {
      height: 16px;
      width: 16px;
      image-rendering: pixelated;
    }
  }

  .new-comments {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    position: fixed;
    left: 25px;
    bottom: 25px;
    padding: 10px;
    width: 200px;

    border: 3px solid #fff;
    font-size: 11px;
    background: #fef6ea;

    a {
      text-decoration: underline;
      color: #545454;
      cursor: pointer;
      font-size: 12px;
      margin: 0 auto 0 10px;

      &:hover {
        color: #fef6ea;
        background: #545454;
      }
    }

    .close {
      cursor: pointer;
    }
  }
`;

const mediaDetectors = Object.entries({
  youtube: new RegExp(
    '(?:")?http(?:s)?://(?:www.)?youtu(?:be)?.(?:[a-z]){2,3}' +
      "(?:[a-z/?=]+)([a-zA-Z0-9-_]{11})(?:[a-z0-9?&-_=]+)?"
  ),
  // vimeo: new RegExp(
  //   "http(?:s)?://(?:www.)?vimeo.com/([0-9]+)(?:#[a-z0-9?&-_=]*)?"
  // ),
  // imgur: new RegExp("http(?:s)?://.*?.imgur.com/(.*?).gifv"),
});

const embed = {
  youtube: (id) => {
    return `<iframe type="text/html" class="youtube-player" src="https://www.youtube.com/embed/${id}" frameborder="0"></iframe>`;
  },
  // vimeo: (id) => {
  //   return "";
  // },
  // imgur: (id) => {
  //   return "";
  // },
};

const pinkieDetector = new RegExp(
  Object.keys(pinkies)
    .map((string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|"),
  "g"
);

const mediaReducer = (acc, [name, test]) => {
  const matches = test.exec(acc);
  if (matches) {
    return acc.replace(matches[0], embed[name](matches[1]));
  }
  return acc;
};

const render = (text) => {
  const fragment = document.createElement("div");
  fragment.innerHTML = mediaDetectors
    // find and replace videos/images/etc
    .reduce(mediaReducer, text)
    // format newlines
    .replace(/\r?\n|\r/g, "<br />\n")
    // format pinkies
    .replace(
      pinkieDetector,
      (match) =>
        `<img class="pinkie" src="${pinkies[match]}" title="${match}" />`
    );

  [...fragment.getElementsByTagName("blockquote")].forEach((item) => {
    const user = item.getAttribute("title");
    const quotedFrom = document.createElement("div");

    quotedFrom.className = "user";
    quotedFrom.innerHTML = `${user} said:`;

    item.prepend(quotedFrom);
  });

  return fragment.innerHTML;
};

const Admin = () => {
  const [thread, setThread] = useRecoilState(threadState);

  const changeSetting = useCallback((settings) => {
    api
      .post("/threads/settings", {
        slug: thread.slug,
        ...settings,
      })
      .then(({ data }) => setThread(data.thread))
      .catch(console.error);
  });

  const toggleNaughty = () => changeSetting({ nsfw: !thread.nsfw });
  const toggleEnabled = () => changeSetting({ enabled: !thread.enabled });

  return (
    <ul className="admin">
      <li className="cta" onClick={toggleNaughty}>
        Mark {thread.nsfw ? "Safe" : "Naughty"}
      </li>
      <li className="cta" onClick={toggleEnabled}>
        {thread.enabled ? "Close" : "Open"} Thread
      </li>
    </ul>
  );
};

export const Comment = ({ comment, contentOnly = false }) => {
  const user = useRecoilValue(userState);
  const setReplyText = useSetRecoilState(replyTextState);
  const [selection, setSelection] = useState("");
  const [viewingSource, setViewingSource] = useState(false);

  const { author } = comment;

  const toggleSource = useCallback(() => setViewingSource(!viewingSource));

  const noteSelection = useCallback(() =>
    setSelection(getSelection().toString())
  );

  const quote = useCallback(() => {
    setReplyText(
      (replyText) =>
        replyText +
        `<blockquote title="${author.name}">${
          selection.length ? selection : comment.content
        }</blockquote>`
    );
    setSelection("");
  });

  let content;
  if (viewingSource && !contentOnly) {
    content = (
      <div className="source">
        <textarea value={comment.content} readOnly />
        <button onClick={toggleSource}>Close</button>
      </div>
    );
  } else if (!user.html) {
    content = (
      <div className="content" onMouseUp={noteSelection}>
        {comment.content}
      </div>
    );
  } else {
    content = (
      <div
        className="content"
        onMouseUp={noteSelection}
        dangerouslySetInnerHTML={{
          __html: render(comment.content),
        }}
      />
    );
  }

  if (contentOnly) {
    return (
      <StyledComment className="comment content-only">{content}</StyledComment>
    );
  }

  return (
    <StyledComment className="comment">
      <div className="commands">
        <a onClick={toggleSource}>view source</a>
        <a onClick={quote}>quote</a>
      </div>
      <div className="info">
        <Link className="name" to={`/user/${author.slug}`}>
          {author.name}
        </Link>
        <div className="when" title={comment.created_at}>
          {loadDatetime(comment.created_at).toRelative()}
        </div>
        <div className="menu">
          <div className="icon">
            <img
              src={author.avatar ? `${avatarLocation}/${author.avatar}` : p05}
              height="16"
              width="16"
            />
          </div>
          <div className="items">
            <Link to={`/buddies/${author.slug}`}>BUDDY? IGNORE?</Link>
            <Link to={`/messages/compose/${author.name}`}>SEND A MESSAGE</Link>
          </div>
        </div>
      </div>
      {content}
    </StyledComment>
  );
};

export default Thread;

const StyledComment = styled.div`
  display: grid;
  grid-template-rows: 20px auto;
  grid-template-columns: 150px auto;
  padding-bottom: 20px;
  border-bottom: solid 1px #ccc;

  &.content-only {
    grid-template-columns: auto;
    grid-template-rows: auto;

    .content {
      margin-top: 0.6rem;
      grid-column: 1;
      grid-row: 1;
    }
  }

  &:hover .commands {
    opacity: 1;
  }

  .commands {
    grid-column: 1 / span 2;
    grid-row: 1;
    display: flex;
    justify-content: end;
    opacity: 0;
    transition: all 0.2s ease-in-out;

    a {
      font-size: 9px;
      color: #ccc;
      margin: 2px 5px auto 2px;
      cursor: pointer;

      &:hover {
        background: #ccc;
        color: #fff;
      }
    }
  }

  .info {
    grid-column: 1;
    grid-row: 2;

    .name {
      line-height: 16px;
      font-size: 12px;
      color: #494949;

      &:hover {
        background: #494949;
        color: #fff;
      }
    }

    .when {
      font-size: 10px;
      color: #888;
    }
  }

  .menu {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: 4px 0 0;

    .icon {
      height: 16px;
      width: 16px;
      margin: 4px 8px 4px 0;

      img {
        image-rendering: pixelated;
      }
    }

    .items {
      display: flex;
      flex-direction: column;
      list-style: none;
      margin: 0;
      padding: 0;

      a {
        display: inline-flex;
        text-transform: uppercase;
        text-decoration: underline;
        font-size: 8px;
        cursor: pointer;

        height: 9px;

        margin-bottom: 2px;
        color: #959595;

        &:hover {
          color: #ffffff;
          background: #959595;
        }
      }

      span {
        margin-right: auto;
        color: #ed135a;

        &:hover {
          background: #ed135a;
          color: #ffffff;
        }
      }
    }
  }

  .content {
    grid-column: 2;
    grid-row: 2;

    font-size: 12px;
    line-height: 1rem;

    iframe {
      width: 100%;
      max-width: 640px;
      aspect-ratio: 16/9;
    }

    a {
      color: #494949;

      &:hover {
        color: #fff;
        background: #494949;
      }
    }

    img,
    picture {
      display: inline;
    }

    .pinkie {
      vertical-align: top;
      margin: 0 1px;
      image-rendering: pixelated;
    }

    blockquote {
      padding: 4px 0 8px 1em;
      margin: 8px 0 1em 0;
      border-left: 1px dotted #999;
      font-style: italic;
      font-size: 11px;
      font-weight: 400;

      .user {
        font-size: 11px;
        display: block;
        font-style: normal;
        font-weight: 700;
        margin-bottom: 5px;
      }

      iframe {
        max-width: 300px !important;
      }
    }
  }

  .source {
    font-size: 12px;
    color: #494949;

    textarea {
      border: 1px solid #eee;
      height: 140px;
      width: 100%;
    }
  }
`;
