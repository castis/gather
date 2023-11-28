import classnames from "classnames";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { Link, Outlet } from "react-router-dom";
import { useRecoilValue } from "recoil";
import styled from "styled-components";

import { api } from "../api";
import { globalKeyState, userState } from "../atoms";
import Pagination from "../components/pagination";
import { Content, Skeleton, Stage, Title } from "../components/stage";
import { loadDatetime, useSingleErrorHandler } from "../utils";

import addIcon from "url:/src/images/chrome/b-add.gif";
import hideIcon from "url:/src/images/chrome/hide-thread.gif";
import naughtyGif from "url:/src/images/chrome/naughty.gif";

const initialTitleState = {
  text: "",
  author: undefined,
};

const Titlematic = ({ titleState }) => {
  const [title, setTitle] = titleState;
  const [editing, setEditing] = useState(false);
  const [error, setError, handleApiError] = useSingleErrorHandler();
  const user = useRecoilValue(userState);

  const start = useCallback(() => {
    if (user?.privileged) setEditing(true);
  });
  const cancel = useCallback(() => {
    setError(undefined);
    setEditing(false);
  });

  const altText = useMemo(() => {
    if (title?.author?.name) {
      const when = loadDatetime(title.created_at).toRelative();
      return `${title.author.name}, ${when}`;
    }
  }, [title]);

  const save = useCallback((e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    return api
      .post(`/threads/title`, Object.fromEntries(form.entries()))
      .then(({ data }) => {
        setTitle(data);
        setEditing(false);
      })
      .catch(handleApiError);
  });

  if (editing) {
    return (
      <Title className="editable">
        <form onSubmit={save}>
          <input
            type="text"
            name="text"
            defaultValue={title.text}
            maxLength={36}
            autoFocus
          />
          <button type="submit">Save</button>
          <button onClick={cancel}>Cancel</button>
          {error?.title && <div className="error">{error.title}</div>}
        </form>
      </Title>
    );
  }

  return (
    <Title onClick={start} title={altText}>
      {title.text}
    </Title>
  );
};

const paramsToURL = (params, exclude = []) => {
  let url = "";

  // Check for type and identifier
  if (params.type && params.identifier) {
    url += `/${params.type}/${params.identifier}`;
  }

  // Append sort and page if they are not excluded and are available
  if (params.sort && !exclude.includes("sort")) {
    url += `/sort/${params.sort}`;
  }
  if (params.page && !exclude.includes("page")) {
    url += `/page/${params.page}`;
  }

  return url;
};

const Threads = () => {
  const params = useParams();
  const user = useRecoilValue(userState);
  const globalKey = useRecoilValue(globalKeyState);
  const [error, setError] = useState();

  const titleState = useState(initialTitleState);
  const [title, setTitle] = titleState;
  const [threads, setThreads] = useState();

  const { page, type, identifier, query, filter, sort: rawsort } = params;

  const [working, setWorking] = useState(true);

  // determine the optional "-" from the sort field
  let sort = "latest";
  let sortDir = "desc";

  if (rawsort) {
    sortDir = rawsort.startsWith("-") ? "desc" : "asc";
    sort = rawsort.startsWith("-") ? rawsort.substring(1) : rawsort;
  }

  useEffect(() => {
    setWorking(true);
    api
      .get("/threads", {
        params: {
          page,
          query,
          [type]: identifier,
          sort,
          dir: sortDir,
        },
      })
      .then(({ data }) => {
        if (data?.title) {
          setTitle(data.title);
        }
        setThreads({
          ...data.threads,
          perPage: data.threads.per_page,
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setWorking(false));
  }, [globalKey, page, type, identifier, query, sort, sortDir]);

  if (!threads?.items || working) {
    return <Skeleton />;
  }

  const paging = (
    <Pagination
      items={threads}
      plural="threads"
      path={paramsToURL(params)}
      cta={
        !!user.id && (
          <Link className="cta" to="/newthread">
            New Thread
          </Link>
        )
      }
    />
  );

  const currentURL = paramsToURL(params, ["sort"]);
  const Sorter = ({ field, children }) => {
    let newDir = "-";
    if (sort == field) {
      newDir = sortDir == "desc" ? "" : "-";
    }

    return <Link to={`${currentURL}/sort/${newDir}${field}`}>{children}</Link>;
  };

  return (
    <Stage>
      {user?.random_titles && title ? (
        <Titlematic titleState={titleState} />
      ) : (
        <Title>Yay Hooray!!!</Title>
      )}
      <Content>
        {paging}
        <Outlet />
        <StyledThreads>
          <div className="header">
            <div>Thread Title & Category</div>
            <div>
              <Sorter field="started">Started By</Sorter>
            </div>
            <div>
              <Sorter field="latest">Last Post</Sorter>
            </div>
            <div>
              <Sorter field="posts">Posts</Sorter>
            </div>
          </div>
          {threads.items
            .map((thread) => {
              const {
                slug,
                category,
                comment_count,
                created_at,
                updated_at,
                author,
                last_author,
              } = thread;

              let totalPages = Math.ceil(
                comment_count / user.comments_per_page
              );
              let pages = [];
              if (totalPages >= 5) {
                pages = [1, 2, "", totalPages - 1, totalPages];
              } else {
                for (let i = 1; i <= totalPages; i++) {
                  pages.push(i);
                }
              }

              return (
                <div
                  key={thread.id}
                  className={classnames({
                    thread: true,
                    nsfw: thread.nsfw,
                    og: !!thread.mongo_id,
                    closed: !thread.enabled,
                  })}
                >
                  <div className="info">
                    <div className="name">
                      <Link className="title" to={`/thread/${slug}`}>
                        {thread.title}
                      </Link>
                      {user.id && (
                        <Link
                          className="end"
                          to={`/thread/${slug}/${totalPages}#bottom`}
                        >
                          #
                        </Link>
                      )}
                    </div>
                    <div className="meta">
                      <div className="category">
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </div>
                      {user?.id && totalPages > 1 && (
                        <div className="paging">
                          Page:
                          {pages.map((c) =>
                            c == "" ? (
                              "..."
                            ) : (
                              <Link key={c} to={`/thread/${slug}/${c}`}>
                                {c.toLocaleString()}
                              </Link>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="author">
                    <Link className="name" to={`/user/${author.slug}`}>
                      {author.name}
                    </Link>
                    <div className="meta" title={created_at}>
                      {loadDatetime(created_at).toRelative()}
                    </div>
                  </div>
                  <div className="last_post">
                    <Link className="name" to={`/user/${last_author.slug}`}>
                      {last_author.name}
                    </Link>
                    <div className="meta" title={updated_at}>
                      {loadDatetime(updated_at).toRelative()}
                    </div>
                  </div>
                  <div className="posts">
                    {thread.comment_count.toLocaleString()}
                  </div>
                  {/* {user.id && (
                    <div className="cmd">
                      <img onClick={() => {}} src={addIcon} />
                      <img onClick={() => {}} src={hideIcon} />
                    </div>
                  )} */}
                </div>
              );
            })
            .flatMap((x, i) => [x, <div key={`b${i}`} className="blueline" />])}
        </StyledThreads>
        {paging}
      </Content>
    </Stage>
  );
};

export default Threads;

const StyledThreads = styled.div`
  .og {
    opacity: 0.6;
  }

  .header,
  .thread {
    display: grid;
    grid-template-columns: auto 22% 22% 50px;
  }

  @media (min-width: 500px) {
    grid-template-columns: auto 19% 19% 50px;
  }

  @media (min-width: 700px) {
    grid-template-columns: auto 19% 19% 6% 50px;
  }

  .header {
    color: #7e7e7e;

    a {
      color: #7e7e7e;
    }

    font-size: 9px;
    padding: 8px 0 8px;

    align-items: end;

    border-bottom: 1px solid #bbbbbb;
  }

  .thread {
    align-items: center;

    background-color: #f5fbfe;

    padding: 6px;
    margin: 2px 0;

    font-size: 12px;

    .title {
      color: #7e7e7e;
      font-weight: 700;
      text-decoration: underline;
    }
    span.title {
      cursor: not-allowed;
    }

    &.nsfw {
      background-image: url(${naughtyGif});
      background-repeat: no-repeat;
      background-position: 6px 8px;

      .info {
        padding-left: 32px;
      }
      .title {
        color: #f06171;
      }
    }

    &.closed {
      color: #999;

      .title {
        text-decoration: line-through;
        color: #999;
      }
    }

    .info {
      padding-right: 5px;

      .end {
        margin-left: 5px;
        font-size: 10px;
        color: #959595;
        font-weight: 500 !important;

        &:hover {
          color: #ffffff;
          background-color: #959595;
        }
      }
    }

    .author,
    .last_post {
      padding-right: 5px;
      display: flex;
      flex-direction: column;

      .name {
        color: #7e7e7e;
        font-weight: 700;
        max-width: 100%;
        white-space: nowrap;
        text-overflow: ellipsis;
        text-decoration: underline;
        overflow: hidden;
        margin-right: auto;
      }
      span.name {
        cursor: not-allowed;
      }
    }

    .info,
    .author,
    .last_post {
      a {
        font-weight: 700;
        color: #494949;

        &:hover {
          color: #ffffff;
          background-color: #494949;
        }
      }

      .meta {
        display: flex;
        flex-direction: row;

        font-size: 9px;
        padding: 4px 0 0;
        color: #959595;

        .paging {
          border-left: solid 1px #95959555;
          padding-left: 5px;
          margin-left: 5px;

          display: flex;
          flex-direction: row;
          align-items: center;
          font-size: 8px;

          a {
            padding: 1px;
            font-weight: 500;
            text-decoration: none;
          }
        }
      }
    }

    .posts {
      padding-left: 6px;
    }

    .cmd {
      display: flex;
      gap: 5px;
      margin: 8px 0 auto auto;
    }
  }
`;
