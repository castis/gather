import React, { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import styled from "styled-components";

import pinkie from "url:/src/images/pinkies/07.gif";
import { api } from "../api";
import { userState } from "../atoms";
import { avatarLocation } from "../config";
import { useErrorHandler } from "../utils";

export default ({ resetState }) => {
  const user = useRecoilValue(userState);
  const [forgot, setForgot] = useState(false);

  if (forgot) {
    return <Forgot setForgot={setForgot} />;
  } else if (!user?.id) {
    return <Login setForgot={setForgot} />;
  }

  const logout = () => {
    api.post("/auth/logout").then(resetState).catch(resetState);
  };

  return (
    <StyledMe className="me">
      <div className="head">
        Hi, <Link to={`/user/${user.name}`}>{user.name}</Link>
      </div>
      <div className="menu">
        <div className="icon">
          {user.avatar && (
            <img
              src={`${avatarLocation}/${user.avatar}`}
              height="16"
              width="16"
            />
          )}
        </div>
        <div className="items">
          <Link to="/preferences">Preferences</Link>
          <span onClick={logout}>Logout</span>
        </div>
      </div>
    </StyledMe>
  );
};
const StyledMe = styled.div`
  // background: ${({ theme }) => (theme.light ? "black" : "white")};

  background: #fff;
  border: 1px dotted #959595;
  padding: 10px 10px 8px;

  .head {
    font-size: 12px;
    font-weight: 700;
    // line-height: 12px;

    &,
    & a {
      color: #494949;
    }

    a:hover {
      background: #494949;
      color: #fff;
    }
  }

  .menu {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: 6px 0 0;

    .icon {
      height: 16px;
      width: 16px;
      margin: 4px 8px 4px 4px;
      background: lightgrey;
    }

    .items {
      display: flex;
      flex-direction: column;
      list-style: none;
      margin: 0;
      padding: 0;

      a,
      span {
        display: inline-flex;
        text-transform: uppercase;
        text-decoration: underline;
        font-size: 8px;
        cursor: pointer;

        // line-height: 8px;
        height: 9px;
      }

      a {
        margin-bottom: 2px;
        color: #494949;

        &:hover {
          color: #ffffff;
          background: #494949;
        }
      }

      span {
        margin-right: auto;
        color: #ed135a;

        &:hover {
          background: #ed135a;
          color: #ffffff;
        }
      }
    }
  }
`;

const loginButtons = [
  "Lets Go!",
  "Booyah!",
  "Do It!",
  "Go For It!",
  "Zippity!",
  "Get In!",
  "Push Me",
];

const Login = ({ setForgot }) => {
  const setUser = useSetRecoilState(userState);
  const [errors, setErrors, handleApiError] = useErrorHandler("name");

  const loginButton = useMemo(
    () => loginButtons[Math.floor(Math.random() * loginButtons.length)],
    []
  );

  const submit = useCallback((e) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.target).entries());

    const form_errors = {};
    if (!form.name) form_errors.name = "required";
    if (!form.password) form_errors.password = "required";
    if (Object.keys(form_errors).length) return setErrors(form_errors);

    api
      .post("/auth/login", form)
      .then(({ data }) => {
        if (data?.id) setUser(data);
      })
      .catch(handleApiError);
  }, []);

  const clickForgot = useCallback((e) => {
    e.preventDefault();
    setForgot(true);
  });

  return (
    <StyledLogin className="me">
      <div className="head">Not a member? Wanna join up? Tell us why!</div>
      <div className="info">
        <img src={pinkie} className="pinkie" />
        <Link to="/join">Click here for more info, n00b!</Link>
      </div>
      <form onSubmit={submit}>
        <div className="input">
          <label htmlFor="name">U:</label>
          <input
            type="text"
            name="name"
            id="name"
            defaultValue=""
            tabIndex="1"
          />
          {errors?.name && <div className="error">{errors.name}</div>}
          <button type="submit" tabIndex="3">
            {loginButton}
          </button>
        </div>
        <div className="input">
          <label htmlFor="password">P:</label>
          <input
            type="password"
            name="password"
            id="password"
            defaultValue=""
            tabIndex="2"
          />
          {errors?.password && <div className="error">{errors.password}</div>}
          <a onClick={clickForgot}>Forgot it?</a>
        </div>
      </form>
    </StyledLogin>
  );
};

const Forgot = ({ setForgot }) => {
  const [errors, setErrors, handleApiError] = useErrorHandler();
  const [complete, setComplete] = useState();

  const submit = (e) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.target).entries());
    if (!form.email) return setErrors({ email: "Email is required" });

    api
      .post("/auth/forgot", form)
      .then(({ status }) => {
        setComplete(status == 204);
      })
      .catch(handleApiError);
  };

  return (
    <StyledLogin className="me">
      <div className="close" onClick={() => setForgot(false)}>
        x
      </div>
      <div className="head">Woops, you forgot your password? We can help.</div>
      <div className="subhead">
        <p>Whats your email address?</p>
        <p>
          <Link to="/join">coming from YH3? click me</Link>
        </p>
      </div>
      {complete ? (
        <div className="subhead">Check your inbox</div>
      ) : (
        <form onSubmit={submit}>
          <div className="input">
            <label htmlFor="email">E:</label>
            <input
              type="email"
              name="email"
              id="email"
              defaultValue=""
              placeholder="you@example.com"
            />
            {errors.email && <div className="error">{errors.email}</div>}
            <button type="submit">
              {loginButtons[Math.floor(Math.random() * loginButtons.length)]}
            </button>
          </div>
        </form>
      )}
    </StyledLogin>
  );
};

const StyledLogin = styled.div`
  /* Adapt the colors based on primary prop */
  // background: ${(props) => (props.primary ? "palevioletred" : "white")};
  // color: ${(props) => (props.primary ? "white" : "palevioletred")};

  background: #494949;
  padding: 10px;
  margin-bottom: 15px;
  position: relative;

  .close {
    top: 10px;
    right: 10px;
    position: absolute;
    cursor: pointer;
    height: 10px;
    line-height: 8px;
    color: #ccc;
  }

  .head {
    font-size: 14px;
    font-weight: 700;
    // line-height: 14px;
    display: block;
    color: #fff;
  }

  .info {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: 8px 0;
    line-height: 12px;
  }

  .subhead {
    padding: 7px 0;

    p {
      line-height: 16px;
    }
  }

  .info,
  .subhead {
    font-size: 9px;

    &,
    a {
      color: #ffffff;
    }

    a {
      text-decoration: underline;

      &:hover {
        color: #494949;
        background-color: #ffffff;
      }
    }

    .pinkie {
      height: 14px;
      width: 14px;
      margin-right: 3px;
    }
  }

  .error-msg {
    font-size: 9px;
    margin: 0 0 8px;
    color: #faa4a4;
  }

  .input {
    display: grid;
    flex-direction: row;
    align-items: center;
    font-size: 9px;

    &:last-of-type {
      margin-top: 5px;
    }

    label {
      width: 10px;
      color: #fff;
      grid-column: 1;
    }

    input,
    button {
      border: solid 1px #8f8f9d;
      border-radius: 2px;
      padding: 2px 3px;

      &:focus {
        border-color: #ff9898;
        outline: none;
      }
    }

    input {
      width: 100px;
      height: 20px;
      color: #494949;
      border-radius: 2px;
      grid-column: 2;
    }

    button,
    a {
      display: block;
      width: 50px;
      min-width: 50px;
      text-align: center;
      grid-column: 3;
    }

    a {
      text-decoration: underline;
      cursor: pointer;
      color: #959595;
      font-size: 10px;
    }

    button {
      color: #494949;
      border-radius: 4px;
    }

    .error {
      grid-column: 2 / span 2;
      grid-row: 2;
      color: #faa4a4;
      font-size: 9px;
    }
  }
`;
