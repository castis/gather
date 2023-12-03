import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router";

import { api } from "../../api";
import { Stage, Title, Content } from "../../components/stage";
import styled from "styled-components";
import { Link } from "react-router-dom";

const Box = ({ path }) => {
  const [messages, setMessages] = useState({
    items: [],
    total: 0,
    page: 1,
    pages: 1,
  });
  const [page, setPage] = useState(1);

  useEffect(() => {
    api
      .get(`/messages/${path}`, { params: { page } })
      .then((response) => {
        console.log(response);
        if (response) {
          const { data } = response;
          console.log(data);
          setMessages(data);
        }
      })
      .catch(console.log);
  }, [page]);

  return (
    <Stage>
      <Title>Well aren't you Mr. Popular?</Title>
      <StyledContent>
        <div className="controls">
          <Link to="/messages/compose" className="new-thread">
            New Message
          </Link>
        </div>
        <div className="controls2">
          <Link to="/messages/inbox">
            Inbox (0)
          </Link>
          <Link to="/messages/sent">
            Sent Items
          </Link>
        </div>
        {messages.items.map((message) => {
          return (
            <div key={message.id} className="message">
              <Link to={`/messages/message/${message.slug}`}>
                {message.title}
              </Link>
            </div>
          );
        })}
      </StyledContent>
    </Stage>
  );
};

export const Inbox = () => <Box path="inbox" />;
export const Sent = () => <Box path="sent" />;

const StyledContent = styled(Content)`
  .controls {
    border-bottom: 1px dotted #959595;
    display: flex;
    // flex-direction: row;
    padding-bottom: 10px;

    .new-thread {
      color: #494949;
      background-color: #e6f7fe;
      text-transform: uppercase;
      font-size: 9px;
      margin-left: auto;
      padding: 4px;

      &:hover {
        background-color: #494949;
        color: #e6f7fe;
      }
    }
  }
`;
