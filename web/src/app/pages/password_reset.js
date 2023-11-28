import React, { useCallback, useState } from "react";
import { useParams } from "react-router";
import styled from "styled-components";

import { api } from "../api";
import { Stage, Title, Content } from "../components/stage";
import { useErrorHandler } from "../utils";

const PasswordReset = () => {
  const { token } = useParams();
  const [errors, setErrors, handleApiError] = useErrorHandler("token");
  const [working, setWorking] = useState(false);
  const [complete, setComplete] = useState(false);

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();

      setErrors({});

      const form = new FormData(e.target);
      const password = form.get("password");
      const confirmation = form.get("confirmation");

      const new_errors = {};
      if (!password) new_errors.password = "required";
      if (!confirmation) new_errors.confirmation = "required";
      if (Object.keys(new_errors).length) return setErrors(new_errors);

      setWorking(true);
      api
        .post(`/auth/set_password`, Object.fromEntries(form.entries()))
        .then(({ status }) => {
          if (status == 204) setComplete(true);
        })
        .catch(handleApiError)
        .finally(() => setWorking(false));
    },
    [token]
  );

  return (
    <Stage>
      <Title>Password Reset</Title>

      <StyledResetContent>
        {complete ? (
          <p>Hooray, your password has been reset!</p>
        ) : (
          <form onSubmit={onSubmit}>
            <p>Once you've reset your password you'll be able to log in.</p>

            <div className="field">
              <label>Reset token:</label>
              <input
                type="text"
                name="token"
                disabled={working}
                defaultValue={token}
              />
              {errors?.token && <div className="error">{errors.token}</div>}
            </div>

            <div className="field">
              <label>Password:</label>
              <input type="password" name="password" disabled={working} />
              {errors?.password && (
                <div className="error">{errors.password}</div>
              )}
            </div>

            <div className="field">
              <label>Again, please:</label>
              <input type="password" name="confirmation" disabled={working} />
              {errors?.confirmation && (
                <div className="error">{errors.confirmation}</div>
              )}
            </div>

            <button type="submit">
              {working ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </StyledResetContent>
    </Stage>
  );
};

const StyledResetContent = styled(Content)`
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

export default PasswordReset;
