import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
  Fragment,
} from "react";
import { useParams } from "react-router";
import { DateTime } from "luxon";

import { api } from "../../api";
import { Stage, Title, Content } from "../../components/stage";
import Pagination from "../../components/pagination";
import styled from "styled-components";
import { Link } from "react-router-dom";
import {
  loadDatetime,
  useSetTitle,
  useErrorHandler,
  Checkbox,
} from "../../utils";
import classNames from "classnames";

import { atom } from "recoil";

const selectedState = atom({
  key: "selectedState",
  default: [],
});

export const MessengerControls = ({ path, children }) => {
  return (
    <div className="controls">
      <div className="boxes">
        <Link to="/messages/inbox" className={path == "inbox" && "active"}>
          Inbox
        </Link>
        <div className="separator" />
        <Link to="/messages/sent" className={path == "sent" && "active"}>
          Sent
        </Link>
      </div>
      {children}
    </div>
  );
};

const Box = ({ path }) => {
  useSetTitle((p) => `${p} - Messages`);
  const [error, setError, handleApiError] = useErrorHandler();
  const [working, setWorking] = useState(false);
  const [selected, setSelected] = useState([]);
  const [messages, setMessages] = useState({
    items: [],
    total: 0,
    page: 1,
    pages: 1,
  });
  const [page, setPage] = useState(1);

  const handleTopCheckbox = useCallback(
    (e) =>
      setSelected(e.target.checked ? messages.items.map((m) => m.slug) : []),
    [messages]
  );

  const handleMessageCheckbox = (e) => {
    const { slug } = e.target.dataset;
    if (selected.includes(slug)) {
      setSelected(selected.filter((i) => i !== slug));
    } else {
      setSelected([...selected, slug]);
    }
  };

  useEffect(() => {
    setWorking(true);
    api
      .get(`/messages/${path}`, { params: { page } })
      .then((response) => {
        if (response) {
          const { data } = response;
          setMessages(data);
        }
      })
      .catch(handleApiError)
      .finally(() => setWorking(false));
  }, [page]);

  const markRead = useCallback(() => {
    setWorking(true);
    api
      .post(`/messages/update`, { slugs: selected })
      .then((response) => {
        if (response) {
          const { data } = response;
          // console.log(data);
          setMessages(data);
        }
      })
      .catch(handleApiError)
      .finally(() => setWorking(false));
  }, [selected]);

  const markDeleted = useCallback(() => {
    setWorking(true);
    api
      .delete(`/messages/update`, { slugs: selected })
      .then((response) => {
        if (response) {
          const { data } = response;
          // console.log(data);
          setMessages(data);
        }
      })
      .catch(handleApiError)
      .finally(() => setWorking(false));
  }, [selected]);

  const topCheckboxProps = useMemo(() => {
    const { items } = messages;
    const all = items.length > 0 && items.length === selected.length;
    return {
      checked: all,
      indeterminate: selected.length > 0 && !all,
    };
  }, [messages, selected]);

  return (
    <Stage>
      <Title>Well aren't you Mr. Popular?</Title>
      <StyledContent>
        <Pagination
          items={messages}
          plural="messages"
          path={"/messages"}
          cta={
            <Link to="/messages/compose" className="cta">
              New Message
            </Link>
          }
        />

        <MessengerControls>
          <div
            className={classNames({
              actions: true,
              active: selected.length > 0,
            })}
          >
            <span onClick={markRead}>Mark Read</span>
            <div className="separator" />
            <span onClick={markDeleted}>Delete</span>
          </div>
        </MessengerControls>

        <div className="header">
          <div className="subject">
            <Checkbox onChange={handleTopCheckbox} {...topCheckboxProps} />
            Subject
          </div>
          <div className="user">{path === "inbox" ? "From" : "To"}</div>
          <div className="date">Date</div>
        </div>
        {messages.items.map((message, i) => {
          const author = path === "inbox" ? message.author : message.recipient;
          const createdAt = loadDatetime(message.created_at);
          return (
            <Fragment key={message.slug}>
              <div
                className={classNames({
                  message: true,
                  unread: !message.read,
                  alt: i % 2 === 0,
                })}
              >
                <div className="subject">
                  <input
                    type="checkbox"
                    data-slug={message.slug}
                    onChange={handleMessageCheckbox}
                    checked={selected.includes(message.slug)}
                  />
                  <Link to={`/messages/message/${message.slug}`}>
                    {message.title}
                  </Link>
                </div>
                <div className="user">
                  <Link to={`/user/${author.slug}`}>{author.name}</Link>
                </div>
                <div
                  className="date"
                  title={createdAt.toLocaleString(DateTime.DATETIME_FULL)}
                >
                  {createdAt.toRelative()}
                </div>
              </div>
              <div className="blueline" />
            </Fragment>
          );
        })}
      </StyledContent>
    </Stage>
  );
};

export const Inbox = () => <Box path="inbox" />;
export const Sent = () => <Box path="sent" />;

export const StyledContent = styled(Content)`
  .controls {
    background: #ffeaea;
    border-bottom: 1px dotted #959595;
    padding: 6px;

    display: grid;
    grid-template-columns: 4fr 2fr;
    align-items: center;

    .boxes,
    .actions {
      display: flex;
      align-items: center;
    }

    a,
    span {
      color: #494949;
      font-size: 11px;
      padding: 2px;
      text-decoration: underline;
      cursor: pointer;

      &:hover {
        color: #ffeaea;
        background: #494949;
      }
    }

    .separator {
      margin: 0 3px;
      width: 1px;
      height: 10px;
      background: #494949;
    }

    .boxes {
      a.active {
        // opacity: 0.7;
        text-decoration: none;
        pointer-events: none;
      }
    }

    .actions {
      opacity: 0.5;
      pointer-events: none;

      &.active {
        opacity: 1;
        pointer-events: all;
      }
    }
  }

  .header {
    font-size: 9px;
    border-bottom: 1px solid #bbb;
    padding: 4px 0;
  }

  .message {
    font-size: 12px;
    background: #f5fbfe;
    padding: 2px 0;
    border-width: 2px 0;
    border-style: solid;
    border-color: #fff;

    a {
      color: #494949;
      &:hover {
        color: #f5fbfe;
        background-color: #494949;
      }
    }

    &.alt {
      background: #f9fcfe;
      a:hover {
        color: #f9fcfe;
      }
    }

    &.unread {
      background: #ebf2df;
      a:hover {
        color: #ebf2df;
      }
    }
  }

  .blueline {
    grid-column: 1 / span 3;
    grid-row: 2;
    box-sizing: content-box;
    // background: orange;
    background-color: #ace1f9;
  }

  .header,
  .message {
    display: grid;
    grid-template-columns: 4fr 1fr 1fr;
    grid-template-rows: auto 1px;
    gap: 0 10px;
    // padding: 10px 0;
    align-items: center;

    .subject,
    .user,
    .date {
      display: flex;
      align-items: center;
    }

    .subject {
      grid-column: 1;

      input {
        margin-right: 5px;
      }

      a {
        font-size: 12px;
        text-decoration: underline;
        cursor: pointer;
      }
    }

    .user {
      grid-column: 2;
    }

    .date {
      grid-column: 3;
    }
  }
`;
