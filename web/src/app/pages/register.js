import React, { useState, useRef, useCallback } from "react";

import { Stage, Title, Content } from "../components/stage";

export default () => {
  const [errors, setErrors] = useState({});
  const getError = useCallback((name) => errors?.[name]);

  const submit = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    api
      .post("/auth/register", Object.fromEntries(form.entries()))
      .catch((error) => {
        const { request, response, message } = error;
        if (response) {
          const { data, status, headers } = response;
          setErrors(data.msg);
        }
      })
      .then((response) => console.log(response));
  };

  return (
    <Stage>
      <Title>Register</Title>
      <Content>
        <form onSubmit={submit}>
          <div>
            <label>name</label>
            <input type="text" name="name" defaultValue="" />
            {getError("name")}
          </div>
          <div>
            <label>email</label>
            <input type="email" name="email" defaultValue="" />
            {getError("email")}
          </div>
          <div>
            <label>password</label>
            <input type="password" name="password" defaultValue="" />
            {getError("password")}
          </div>
          <input type="submit" name="Sign Up" />
        </form>
      </Content>
    </Stage>
  );
};
