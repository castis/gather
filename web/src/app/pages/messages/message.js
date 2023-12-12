import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { PaginationView } from "../../components/pagination";
import { Content, Stage, Title } from "../../components/stage";
import { Comment } from "../thread";
import { StyledContent, MessengerControls } from "./inbox";
import { TextEditor } from "../../components/texteditor";

const DirectMessage = () => {
  const { slug, page } = useParams();
  const [message, setMessage] = useState({
    title: "",
    content: "",
    author: {},
  });

  useEffect(() => {
    api
      .post(`/messages/message`, { slug, page })
      .then(({ data }) => {
        console.log(data);
        setMessage(data);
      })
      .catch(console.log);
  }, [slug, page]);

  return (
    <Stage>
      <Title>{message.title}</Title>
      <StyledContent>
        <PaginationView />
        <MessengerControls />
        <Comment key={message.id} comment={message} />
        <form>
          <TextEditor />
        </form>
      </StyledContent>
    </Stage>
  );
};

export default DirectMessage;
