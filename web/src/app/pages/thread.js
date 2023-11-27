import { camelCase, startCase } from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import { Link, useNavigate } from "react-router-dom";
import { atom, useRecoilState, useRecoilValue } from "recoil";
import styled from "styled-components";

import { api } from "../api";
import { replyTextState, userState } from "../atoms";
import Pagination from "../components/pagination";
import { Reply } from "../components/reply";
import { Content, Skeleton, Stage, Title } from "../components/stage";
import { pinkies } from "../components/texteditor";
import { avatarLocation } from "../config";
import { loadDatetime, useSingleErrorHandler } from "../utils";

import p05 from "url:/src/images/pinkies/05.gif";

const threadState = atom({
  key: "thread",
  default: {},
});

const Thread = () => {
  const params = useParams();
  const user = useRecoilValue(userState);
  const [thread, setThread] = useRecoilState(threadState);
  const [comments, setComments] = useState([]);

  const [working, setWorking] = useState(true);
  const [error, setError] = useState();

  const navigate = useNavigate();

  const slug = params.slug;
  const page = params.page || 1;

  const setThreadInfo = useCallback(({ data }) => {
    setThread(data.thread);
    setComments({
      ...data.comments,
      perPage: data.comments.per_page,
    });
  });

  useEffect(() => {
    setWorking(true);
    setError(null);

    api
      .get(`/threads/detail`, { params: { slug, page } })
      .then(setThreadInfo)
      .catch(useSingleErrorHandler)
      // .finally(() => setWorking(false));
  }, []);

  const onUpdateData = useCallback(({ data }) => {
    if (data.comments.page != page) {
      navigate(`/thread/${data.thread.slug}/${data.comments.page}#bottom`);
    } else {
      setThreadInfo({ data });
    }
  });

  // if (error) {
  //   return error;
  // }

  if (working) {
    return <Skeleton />;
  }

  const paging = (
    <Pagination
      items={comments}
      plural="comments"
      path={`/thread/${slug}`}
    >
      in <Link to="/">Threads</Link> &gt;{" "}
      <Link to={`/category/${thread.category}`}>
        {startCase(camelCase(thread.category))}
      </Link> &gt;{" "}
      <Link to={`/thread/${thread.slug}`}>{thread.title}</Link>
    </Pagination>
  );

  return (
    <Stage>
      <Title>{thread?.title}</Title>
      <StyledThread>
        {paging}
        <div className="comments">
          {comments?.items?.map((comment, i) => (
            <Comment
              key={i}
              thread={thread}
              comment={comment}
              showAdmin={thread.author?.id === user.id}
            />
          ))}
        </div>
        {paging}
        <Reply thread={thread} onUpdateData={onUpdateData} />
      </StyledThread>
    </Stage>
  );
};

const StyledThread = styled(Content)`
  .reply-form {
    margin-top: 15px;
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

const pinkieDetector = new RegExp(Object.keys(pinkies)
  .map((string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|'), 'g');

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
    .replace(pinkieDetector, (match) => `<img class="pinkie" src="${pinkies[match]}" title="${match}" />`);

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
  const navigate = useNavigate();

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
    <div className="admin">
      <h5>Thread Admin</h5>
      <ul>
        <li onClick={toggleNaughty}>{thread.nsfw ? "Unm" : "M"}ark Naughty</li>
        <li onClick={toggleEnabled}>
          {thread.enabled ? "Close" : "Open"} Thread
        </li>
      </ul>
    </div>
  );
};

export const Comment = ({
  comment,
  showAdmin = false,
  contentOnly = false,
}) => {
  const user = useRecoilValue(userState);
  const [replyText, setReplyText] = useRecoilState(replyTextState);
  const [selection, setSelection] = useState("");
  const [viewingSource, setViewingSource] = useState(false);

  const { author } = comment;

  const toggleSource = useCallback(() => setViewingSource(!viewingSource));

  const noteSelection = useCallback(() =>
    setSelection(getSelection().toString())
  );

  const quote = useCallback(() => {
    setReplyText(
      replyText +
      `<blockquote title="${author.name}">${selection.length ? selection : comment.content
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
    return <StyledComment className="comment content-only">
      {content}
    </StyledComment>;
  }

  return (
    <StyledComment className="comment">
      <div className="commands">
        <a onClick={toggleSource}>view source</a>
        <a onClick={quote}>quote</a>
      </div>
      {showAdmin && <Admin />}
      <div className="info">
        <Link className="name" to={`/user/${author.slug}`}>
          {author.name}
        </Link>
        <div className="when" title={comment.created_at}>
          {loadDatetime(comment.created_at).toRelative()}
        </div>
        <div className="menu">
          <div className="icon">
            {author.avatar && (
              <img
                src={`${avatarLocation}/${author.avatar}`}
                height="16"
                width="16"
              />
            ) || (
              <img
                src={p05}
                height="16"
                width="16"
              />
            )}
          </div>
          <div className="items">
            <Link to={`/user/${author.slug}`}>BUDDY? IGNORE?</Link>
            {/* <Link to={`/message/${author.name}`}>SEND A MESSAGE</Link> */}
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

  .admin {
    // grid-column: 1;
    // grid-row: 2;
    margin-top: 16px;
    margin-right: auto;

    background: #f4f4f4;
    border: 1px dotted #8a8a8a;
    padding: 5px 10px 5px 5px;
    margin-bottom: auto;

    font-size: 9px;

    h5 {
      margin: 0;
      font-weight: 500;
      font-size: 9px;
      text-transform: uppercase;
    }

    ul {
      margin: 0;
      padding: 0 0 0 10px;

      li {
        margin: 3px 0;
        color: #ed135a;
        cursor: pointer;

        &:hover {
          color: #fff;
          background: #ed135a;
        }
      }
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
