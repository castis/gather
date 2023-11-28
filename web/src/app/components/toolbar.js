import React, { useCallback, useEffect, useState } from "react";

import classNames from "classnames";
import { Link, useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import styled from "styled-components";

import { api } from "../api";
import { buddiesState, globalKeyState, initialUser, userState } from "../atoms";
import Me from "./me";

import logo from "/src/images/chrome/logo.svg";

const Toolbar = () => {
  const [user, setUser] = useRecoilState(userState);
  const [buddies, setBuddies] = useRecoilState(buddiesState);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [globalKey, setGlobalKey] = useRecoilState(globalKeyState);
  const navigate = useNavigate();

  const updateMe = useCallback(() => {
    api
      .post("/auth/ping")
      .then(({ data }) => {
        const { user } = data;
        if (!user?.id) return;
        setUser(user);
        setBuddies(data?.buddies || []);
      })
      .catch(({ response }) => {
        if (response?.status >= 400 && response?.status < 500) {
          resetState();
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const resetState = useCallback(() => setUser({ ...initialUser }), []);

  useEffect(updateMe, [globalKey]);

  const reload = useCallback(() => {
    setGlobalKey(new Date().getTime());
    navigate("/");
  });

  const search = useCallback((e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    navigate(`/find/${form.get("query")}`);
  });

  const htmlSwitch = useCallback((e) => {
    e.preventDefault();
    api.post("/preferences/html").then((response) => {
      setUser({ ...user, ...response.data });
    });
  });

  const toggleVisible = useCallback((e) => {
    e.preventDefault();
    setVisible(!visible);
  });

  if (loading) return <View />;

  return (
    <View>
      <div className="commands">
        <div
          onClick={toggleVisible}
          className={classNames({
            "menu-toggle": true,
            toggled: visible,
          })}
        >
          <svg viewBox="0 0 100 100">
            <path
              className="line line1"
              d="M 20,29.000046 H 80.000231 C 80.000231,29.000046 94.498839,28.817352 94.532987,66.711331 94.543142,77.980673 90.966081,81.670246 85.259173,81.668997 79.552261,81.667751 75.000211,74.999942 75.000211,74.999942 L 25.000021,25.000058"
            />
            <path className="line line2" d="M 20,50 H 80" />
            <path
              className="line line3"
              d="M 20,70.999954 H 80.000231 C 80.000231,70.999954 94.498839,71.182648 94.532987,33.288669 94.543142,22.019327 90.966081,18.329754 85.259173,18.331003 79.552261,18.332249 75.000211,25.000058 75.000211,25.000058 L 25.000021,74.999942"
            />
          </svg>
        </div>
        <div onClick={reload} className="logo">
          <img src={logo} height="14px" />
        </div>
      </div>

      <div
        className={classNames({
          contents: true,
          visible,
        })}
        aria-expanded={visible}
      >
        <Me resetState={resetState} />
        {/* {user.id && <Messaging />} */}
        <div className="threads">
          <Link to="/" className="header">
            Threads
          </Link>
          <ul className="categories">
            <li>
              <Link to="/category/discussion">Discussions</Link>
            </li>
            <li>
              <Link to="/category/project">Projects</Link>
            </li>
            <li>
              <Link to="/category/advice">Advice</Link>
            </li>
            <li>
              <Link to="/category/meaningless">Meaningless</Link>
            </li>
          </ul>

          {user.id && (
            <ul className="special">
              <li>
                <Link to="/category/meaningful">All But Meaningless</Link>
              </li>
              {/* <li>
                <Link to="/filter/participated">Participated</Link>
              </li>
              <li>
                <Link to="/filter/favorite">Favorite</Link>
              </li>
              <li>
                <Link to="/filter/hidden">Hidden</Link>
              </li> */}
              <li>
                <Link to={`/startedby/${user.slug}`}>Started</Link>
              </li>
            </ul>
          )}

          {user.id && (
            <form className="search" onSubmit={search}>
              <label htmlFor="query">Search Thread Titles</label>
              <input type="text" id="query" name="query" placeholder="Search" />
              <button type="submit">Go</button>
            </form>
          )}

          {user.id && (
            <div className="html-switch">
              <a onClick={htmlSwitch}>Turn {user.html ? "Off" : "On"} HTML</a>
            </div>
          )}
        </div>
        {user.id && (
          <div className="buddies">
            <div className="header">
              <Link to="/buddies" className="mine">Buddies</Link>
              {/* <Link to="/users" className="all">(All Users)</Link> */}
            </div>
            <div className="subheader">
              ONLINE BUDDIES ({buddies.online.length}/{buddies.total})
            </div>
            <div className="list">
              {buddies?.online.map((buddy) => (
                <Link
                  key={buddy.id}
                  to={`/user/${user.slug}`}
                >
                  {buddy.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </View>
  );
};

export default Toolbar;

const View = styled.div`
  width: 100%;
  // height: 100%:
  padding-bottom: 20px;

  .commands {
    display: grid;
    grid-template-columns: 30px auto 30px;
    align-items: center;
    grid-template-rows: 30px;
    gap: 10px;

    .menu-toggle {
      svg {
        background-color: transparent;
        border: none;
        cursor: pointer;
        display: flex;
        padding: 0;
        height: 30px;
        width: 30px;

        .line {
          fill: none;
          stroke: black;
          stroke-width: 6;
          transition: stroke-dasharray 600ms cubic-bezier(0.4, 0, 0.2, 1),
            stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .line1 {
          stroke-dasharray: 60 207;
          stroke-width: 6;
        }

        .line2 {
          stroke-dasharray: 60 60;
          stroke-width: 6;
        }

        .line3 {
          stroke-dasharray: 60 207;
          stroke-width: 6;
        }
      }

      &.toggled {
        .line1 {
          stroke-dasharray: 90 207;
          stroke-dashoffset: -134;
          stroke-width: 6;
        }
        .line2 {
          stroke-dasharray: 1 60;
          stroke-dashoffset: -30;
          stroke-width: 6;
        }
        .line3 {
          stroke-dasharray: 90 207;
          stroke-dashoffset: -134;
          stroke-width: 6;
        }
      }
    }
  }

  .contents {
    display: flex;
    flex-direction: column;
    gap: 15px;

    margin-bottom: auto;
    width: 200px;
    max-height: 0px;
    transition: max-height 0.3s ease-in-out;
    overflow-y: hidden;
    backdrop-filter: blur(5px);

    position: absolute;
    top: 50px;
    z-index: 10;

    &.visible {
      max-height: 100%;
    }
  }

  .logo {
    display: flex;
    flex-direction: row;
    margin: auto;
    justify-content: center;
    cursor: pointer;
  }

  @media (min-width: 700px) {
    padding-bottom: 0;

    .commands {
      grid-template-columns: 100%;
      align-items: flex-start;
    }

    .logo {
      grid-column: 1;
      margin: 0 auto 0 0;
      justify-content: flex-start;
    }

    .menu-toggle {
      display: none;
    }

    .contents {
      max-height: unset;
      position: static;
      top: unset;
    }
  }

  .threads {
    background: #e9f8fe;
    padding: 10px;

    .header {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    a {
      color: #494949;

      &:hover {
        background: #494949;
        color: #e9f8fe;
      }
    }

    ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .categories {
      font-size: 10px;
      text-transform: uppercase;
      margin: 7px 0;

      li {
        margin-bottom: 4px;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }

    .special {
      font-size: 10px;
      margin-top: 11px;
      padding-top: 9px;
      border-top: 1px dotted #959595;

      li {
        padding-bottom: 6px;
      }

      a {
        color: #959595;

        &:hover {
          background: #959595;
          color: #e9f8fe;
        }
      }
    }

    .search {
      margin-top: 6px;
      padding-top: 7px;
      border-top: 1px dotted #959595;
      display: flex;
      flex-direction: column;

      label {
        font-size: 12px;
        color: #494949;
        font-weight: 700;
        margin: 0;
        padding: 0;
      }

      input,
      button {
        font-family: Arial;
        font-size: 12px;
        color: #494949;
      }

      input {
        margin-bottom: 5px;
        border: solid 1px #8f8f9d;
        border-radius: 2px;
        padding: 2px 3px;

        &:focus {
          border-color: #ff9898;
          outline: none;
          outline: 1px solid white;
        }
      }

      button {
        margin-left: auto;
      }
    }

    .html-switch {
      margin-top: 10px;
      padding-top: 3px;
      border-top: 1px dotted #959595;

      a {
        font-size: 10px;
        cursor: pointer;
        text-decoration: underline;

        color: #494949;
        &:hover {
          background: #494949;
          color: #e9f8fe;
        }
      }
    }
  }

  .buddies {
    padding: 10px;
    background: #edf5e1;
    display: flex;
    flex-direction: column;
    gap: 5px;
    

    .header {
      display: flex;
      flex-direction: row;
      align-items: baseline;
      gap: 5px;

      a {
        color: #494949;

        &.mine {
          font-size: 16px;
          font-weight: 700;
        }
        &.all {
          font-size: 14px;
          font-weight: 400;
        }
      }
    }

    .subheader {
      font-size: 10px;
      color: #494949;
    }

    .list {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 5px;

      a {
        font-size: 11px;
        color: #494949;
        cursor: pointer;

        &:after {
          content: ", ";
        }
        &:last-child:after {
          content: "";
        }

        &:hover {
          background: #494949;
          color: #fff;
        }
      }
    }
  }
`;
