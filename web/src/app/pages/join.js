import React, { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";

import { api } from "../api";
import { Stage, Title, Content } from "../components/stage";
import { useErrorHandler } from "../utils";

export const Joining = () => {
  const { code } = useParams();
  const [errors, setErrors, handleApiError] = useErrorHandler("code");
  const [complete, setComplete] = useState(false);
  const [working, setWorking] = useState(false);

  const onSubmit = useCallback((e) => {
    e.preventDefault();
    if (working || complete) {
      return;
    }

    setWorking(true);
    return api
      .post("/join/verify", {
        ...Object.fromEntries(new FormData(e.target).entries()),
      })
      .then(({ status }) => {
        setComplete(status == 204);
      })
      .catch(handleApiError)
      .finally(() => setWorking(false));
  }, []);

  return (
    <Stage>
      <Title>You're almost there!</Title>

      <StyledJoinContent>
        {complete ? (
          <div className="complete">
            <p>A password reset email has been sent to you.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <p>
              Set your email address here and then we'll have you reset your
              password.
            </p>
            <div className="field">
              <label>Invite Code:</label>
              <input
                type="text"
                name="code"
                disabled={working}
                defaultValue={code}
              />
              {errors?.code && <div className="error">{errors.code}</div>}
            </div>

            <div className="field">
              <label>Email Address:</label>
              <input type="text" name="email" disabled={working} />
              {errors?.email && <div className="error">{errors.email}</div>}
            </div>

            <button type="submit" disabled={working}>
              {working ? "Working..." : "Set email address"}
            </button>
          </form>
        )}
      </StyledJoinContent>
    </Stage>
  );
};

export const Join = () => {
  const [errors, setErrors, handleApiError] = useErrorHandler("name");
  const [complete, setComplete] = useState(false);
  const [working, setWorking] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    if (working || complete) {
      return;
    }
    setErrors({});

    const form = new FormData(e.target);
    if (!form.get("name")) return setErrors({ name: "this one is required" });

    setWorking(true);
    return api
      .post(`/join`, Object.fromEntries(form.entries()))
      .then(({ status }) => {
        setComplete(status == 204);
      })
      .catch(handleApiError)
      .finally(() => setWorking(false));
  };

  return (
    <Stage>
      <Title>To join this iteration of YH...</Title>

      <StyledJoinContent>
        {complete ? (
          <div className="complete">
            <p>
              Check your{" "}
              <a
                target="_blank"
                href="https://www.yayhooray.com/messages/inbox"
              >
                YH inbox
              </a>
              ...
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <p>
              We need to have known you in a previous life. Tell us your YH
              username and we'll send a secret code to your current YH inbox.
              Using that, we know it's you and we can set your email address,
              then your password.
            </p>

            <p>
              If you've lost access to your YH account, email me at{" "}
              <a href="mailto:castis@duckbo.at">castis@duckbo.at</a> and we'll
              help you claim your account.
            </p>

            <div className="field">
              <label>YH3 Username:</label>
              <input type="text" name="name" />
              {errors?.name && <div className="error">{errors.name}</div>}
            </div>

            <button type="submit">
              {working ? "Processing..." : "Let me in!"}
            </button>
          </form>
        )}
      </StyledJoinContent>
    </Stage>
  );
};

const StyledJoinContent = styled(Content)`
  input[type="text"] {
    border: solid 1px #8f8f9d;
    border-radius: 3px;
    padding: 2px 3px;
    transition: border-color 0.3s ease-in-out;

    &:focus {
      border-color: #ff9898;
      outline: none;
    }
  }
`;
