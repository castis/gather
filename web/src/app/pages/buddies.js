import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router";
import styled from "styled-components";
import { useRecoilValue } from "recoil";

import { api } from "../api";
import { userState } from "../atoms";

import { Stage, Title, Content, NotFound, Skeleton } from "../components/stage";
import Pagination from "../components/pagination";
import { Link } from "react-router-dom";

const RelationshipList = ({ title, data, setRelationships }) => {
  const { items } = data;
  const slug = title.toLowerCase();

  const onRemove = (e) => {
    e.preventDefault();
    const name = e.target.dataset.name;
    api
      .delete(`/relationships`, { data: { name } })
      .then((response) => {
        if (response.status == 204) {
          setRelationships((relationships) => {
            return {
              ...relationships,
              [slug]: {
                ...relationships[slug],
                items: relationships[slug].items.filter(
                  (item) => item.name != name
                ),
              },
            };
          });
        }
      })
      .catch((error) => {
        // console.log(error);
      });
  };

  return (
    <div className="group">
      <div className={`people ${title.toLowerCase()}`}>
        <h4>{title}</h4>
      </div>
      <Pagination
        items={data}
        plural={title}
      />
      <div className="people">
        {items.map((user, i) => (
          <div className="person" key={i}>
            <Link className="name" to={`/user/${user.slug}`}>{user.name}</Link>
            <div className="commands">
              <a onClick={onRemove} data-name={user.name}>
                remove
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default () => {
  const user = useRecoilValue(userState);
  const { name } = useParams();
  const [working, setWorking] = useState(false);
  const [errors, setErrors] = useState({});

  const [relationships, setRelationships] = useState({
    buddies: {
      has_next: false,
      has_prev: false,
      items: [],
      page: 1,
      per_page: 25,
      total: 0,
    },
    enemies: {
      has_next: false,
      has_prev: false,
      items: [],
      page: 1,
      per_page: 25,
      total: 0,
    },
  });

  useEffect(() => {
    api.get("/relationships").then(({ data }) => {
      setRelationships(data);
    }).catch((error) => {
      // console.log(error);
    }
    );
  }, []);

  if (!user?.id) {
    return <Skeleton />;
  }

  const onSubmit = (e) => {
    e.preventDefault();

    const form = new FormData(e.target);

    const errors = {};
    if (!form.get("name")) errors.name = "required";
    if (!form.get("type")) errors.type = "required";
    if (errors.name || errors.type) {
      return setErrors(errors);
    }

    setWorking(true);
    return api
      .put(`/relationships`, Object.fromEntries(form.entries()))
      .then(({ status }) => {
        if (status == 204) {
          e.target.reset();
          setErrors({});
        }
      })
      .catch(({ response }) => {
        if (response?.status == 422) {
          setErrors(response.data?.json || {});
        } else {
          setErrors({ name: response?.data || "Unknown error" });
        }
      })
      .finally(() => setWorking(false));
  };

  return (
    <Stage>
      <Title>Keep your friends close and your enemies closer</Title>
      <StyledContent>
        <div className="subhead">
          We'll highlight your buddies posts and show you when they are online
          and you can ignore all those YH users you just can't tolerate.
        </div>

        <div className="controls">
          <form onSubmit={onSubmit}>
            <header>
              <h3>Add a Buddy / Ignore</h3>
            </header>

            <div className="field with-button">
              <label>Username:</label>
              <input
                type="text"
                name="name"
                disabled={working}
                defaultValue={name}
              />
              <button type="submit">{working ? "Adding..." : "Add"}</button>
              {errors?.target && <div className="error">{errors.target}</div>}
            </div>
            <div className="field">
              <label>Pick one:</label>

              <div className="choices">
                <div className="choice">
                  <input
                    type="radio"
                    name="type"
                    value="buddy"
                    id="buddy"
                    defaultChecked={!!name}
                  />
                  <label htmlFor="buddy">Buddy</label>
                </div>

                <div className="choice">
                  <input type="radio" name="type" value="enemy" id="enemy" />
                  <label htmlFor="enemy">Enemy</label>
                </div>
              </div>
              {errors?.type && <div className="error">{errors.type}</div>}
            </div>
          </form>
        </div>

        <div className="blueline" />

        <RelationshipList
          title="Enemies"
          data={relationships.buddies}
          setRelationships={setRelationships}
        />

        <div className="blueline" />

        <RelationshipList
          title="Buddies"
          data={relationships.enemies}
          setRelationships={setRelationships}
        />

        <div className="blueline" />
      </StyledContent>
    </Stage>
  );
};



const StyledContent = styled(Content)`
  h4 {
    color: #494949;
    margin-bottom: 6px;
  }
  .controls,
  .people {
    padding: 12px 0;
  }
  .field.with-button {
    display: grid;
    grid-template-columns: calc(50% - 10px) auto 50px;
    grid-template-rows: auto auto;
    gap: 0 10px;

    .error {
      grid-row: 2;
      grid-column: 2 / span 2;
    }
  }

  .group {
    .people {
      .person {
        font-size: 12px;
        color: #494949;

        .name {

        }

        .commands {
          a {
            font-size: 10px;
            color: #494949;
            background: #fff;
            cursor: pointer;

            &:hover {
              background: #494949;
              color: #fff;
            }
          }
        }
      }
    }
  }
`;
