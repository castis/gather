import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import { api } from "../../api";
import { Content, Stage, Title } from "../../components/stage";
import { Comment } from "../thread";

const DirectMessage = () => {
  const { slug, page } = useParams();
  const [thread, setThread] = useState({
    title: "",
  });

  useEffect(() => {
    api
      .post(`/messages/message`, { slug, page })
      .then(({ data }) => {
        setThread(data);
      })
      .catch(console.log);
  }, [slug, page]);

  console.log(thread.comments);

  return (
    <Stage>
      <Title>{thread.title}</Title>
      <Content>
        {thread.comments?.map((comment) => (
          <Comment key={comment.id} comment={comment} />
        ))}
      </Content>
    </Stage>
  );
};

export default DirectMessage;
