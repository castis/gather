import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router";

import { api } from "../../api";
import { Stage, Title, Content } from "../../components/stage";
import styled from "styled-components";

export default () => {
  const { user } = useParams();
  console.log(user)
//   const [messages, setMessages] = useState();
  const [page, setPage] = useState(1);

  // useEffect(() => {
  //   api
  //     .get("/threads", { params: { page, category } })
  //     .catch((error) => {
  //       console.log(error);
  //     })
  //     .then((response) => {
  //       console.log(response)
  //       if (response) {
  //         const { data } = response;
  //         console.log(data)
  //         setThreads(data);
  //       }
  //     });
  // }, [page]);

  return (
    <Stage>
      <Title>Send a message</Title>
      <Content>
        Message compositor goes here.
      </Content>
    </Stage>
  );
};
