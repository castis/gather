import React, { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router";
import styled from "styled-components";
import { Link, useSearchParams, Outlet } from "react-router-dom";

import { api } from "../api";
import { Stage, Title, Content, Skeleton, NotFound } from "../components/stage";
import { ordinal, formatDate, useSetTitle } from "../utils";
import { Comment } from "../pages/thread";

const User = () => {
  const { name } = useParams();
  const [error, setError] = useState();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    user: {},
    stats: {},
  });
  useSetTitle((p) => `${p} - ${data.user?.name}`);

  useEffect(() => {
    api
      .get(`/users/${name}`)
      .then(({ data }) => {
        setError(false);
        setData(data);
      })
      .catch((e) => setError(e?.response?.status))
      .finally(() => setLoading(false));
  }, [name]);

  const { user, stats, comments } = data;

  const [days, totalPostsPerDay] = useMemo(() => {
    if (user.created_at) {
      const days = Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24));
      return [days, (stats.threads + stats.comments) / days];
    }
    return [0, 0];
  }, [user.created_at, stats.threads, stats.comments]);

  if (loading) return <Skeleton />;
  if (error) return <NotFound />;

  return (
    <Stage>
      <Title>{user.name}</Title>
      <StyledUserPage>
        <div className="info">
          <section>
            <h3>{user.name}</h3>
            <ul>
              <li><Link to={`/messages/compose/${user.slug}`}>Send a message</Link></li>
              <li><Link to={`/buddies/${user.slug}`}>Change buddy status</Link></li>
              <li><Link to={`/startedby/${user.slug}`}>View threads started</Link></li>
            </ul>
          </section>

          <section>
            <h3>Stats</h3>
            <p>
              {user.name} is the {ordinal(user.id)} member of this place and has been here since {formatDate(user.created_at)}.
            </p>
            <p>
              In those {days.toLocaleString()} days, {user.name} has posted {stats.threads.toLocaleString()} threads and {stats.comments.toLocaleString()} comments.
              {!!totalPostsPerDay && `That's a total of ${totalPostsPerDay.toLocaleString()} posts per day.`}
            </p>
            {/* <p>
              {user.name} last logged in on November 8 2023 at 12:33 pm.
              Currently, {user.name} is a friend of 0 users.
              {user.name} has 0 points and can spend another point right now.
            </p> */}
          </section>
        </div>
        <div className="comments">
          {comments.map((comment, i) => (
            <div key={i} className="thread">
              <h3>
                <Link to={`/thread/${comment.thread_slug}`}>
                  {comment.thread_title}
                </Link>
              </h3>
              <Comment comment={comment} contentOnly={true} />
            </div>
          ))}
        </div>
      </StyledUserPage>
    </Stage>
  );
};

const StyledUserPage = styled(Content)`
  display: grid;
  grid-template-columns: 200px auto;
  gap: 20px;

  .info {
    section {
      margin-bottom: 20px;

      background: #F9F9f9;
      border: 1px solid #CCC;

      font-size: 12px;
      line-height: 18px;
      padding: 8px;

      h3 {
        border-bottom: dotted 1px #545454;
        margin-bottom: 3px;
      }

      p {
        margin: 0 0 10px;

        &:last-child {
          margin-bottom: 0;
        }
      }

      ul {
        list-style: none;
        margin: 0;
        padding: 0;

        li {
          margin: 0;
          padding: 0;

          &:before {
            content: "→";
            margin: 0 5px 0 0;
            position: relative;
            top: -1px;
          }
          
          a {
            text-decoration: underline;
            cursor: pointer;
            color: #494949;

            &:hover {
              color: #fff;
              background-color: #494949;
            }
          }
        }
      }
    }
  }

  .comments {
    h3 {
      font-size: 16px;
      text-indent: 5px;

      a {
        cursor: pointer;
        color: #494949;

        &:hover {
          color: #fff;
          background-color: #494949;
        }
      }
    }

    .thread {
      border-bottom: 1px solid #CCC;
      margin: 0 0 20px;

      &:last-child {
        border-bottom: none;
      }
    }

    .comment {
      padding-left: 5px;
      border-bottom: 0;
    }
  }
`;

export default User;
