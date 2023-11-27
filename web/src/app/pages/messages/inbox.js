import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router";

import { api } from "../../api";
import { Stage, Title, Content } from "../../components/stage";
import styled from "styled-components";
import { Link } from "react-router-dom"

const Box = ({ path }) => {
  const [messages, setMessages] = useState({});
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
          <Link to="/messages/write" className="new-thread">
            New Message
          </Link>
        </div>
        {messages.items &&
          messages.items.map((message) => {
            return (
              <div key={message.id} className="message">
                {message.title}
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
`
