import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router";

import { api } from "../api";

import { Stage, Title, Content } from "../components/stage";

export default () => {
  const { filter, page } = useParams();

  console.log(filter, page);

  // const [user, setUser] = useState();

  // useEffect(() => {
  //   api
  //     .get(`/users/${name}`, { params: {} })
  //     .then((response) => setUser(response?.data))
  //     .catch(console.error);
  // }, [name]);

  // if (!user) {
  //   return null;
  // }

  return (
    <Stage>
      <Title>How many Yay freaks does it take to screw in a light bulb?</Title>
      <Content></Content>
    </Stage>
  );
};
