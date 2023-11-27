import React, { useCallback, useState, useEffect } from "react";
import { useParams } from "react-router";
import styled from "styled-components";
import { useSetRecoilState } from "recoil";

import { api } from "../api";
import { Stage, Title, Content } from "../components/stage";
import { useErrorHandler } from "../utils";
import { userState } from "../atoms";

const EmailVerification = () => {
  const { token } = useParams();
  const [errors, setErrors, handleApiError] = useErrorHandler("token");
  const [working, setWorking] = useState(false);
  const [complete, setComplete] = useState(false);
  const setUser = useSetRecoilState(userState);

  const submit = useCallback((data) => {
    setWorking(true);
    api
      .post(`/auth/verify_email`, data)
      .then(({ status }) => {
        if (status == 204) {
          setComplete(true);
          setUser((user) => ({
            ...user,
            email_reset_sent_at: null,
          }));
        }
      })
      .catch(handleApiError)
      .finally(() => setWorking(false));
  });

  const onSubmit = useCallback((e) => {
    e.preventDefault();

    setErrors({});

    const form = new FormData(e.target);
    const token = form.get("token");

    const new_errors = {};
    if (!token) new_errors.token = "required";
    if (Object.keys(new_errors).length) return setErrors(new_errors);

    submit(Object.fromEntries(form.entries()));
  }, []);

  useEffect(() => {
    if (!token) return;
    submit({ token });
  }, []);

  return (
    <Stage>
      <Title>Email Verification</Title>

      <StyledEmailContent>
        {complete ? (
          <p>Hooray, your email has been verified.</p>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="field">
              <label>Verification token:</label>
              <input
                type="text"
                name="token"
                disabled={working}
                defaultValue={token}
              />
              {errors?.token && <div className="error">{errors.token}</div>}
            </div>

            <button type="submit">
              {working ? "Verifying..." : "Verify Email"}
            </button>
          </form>
        )}
      </StyledEmailContent>
    </Stage>
  );
};

const StyledEmailContent = styled(Content)`
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

export default EmailVerification;
