import React, { useState, useEffect, useRef, useCallback } from "react";
// import { useParams } from "react-router";
import { useRecoilState, useSetRecoilState } from "recoil";
import styled from "styled-components";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../api";
import { Stage, Title, Content } from "../components/stage";
import { TextEditor } from "../components/texteditor";
import { textAtomFamily } from "../atoms";
import { useErrorHandler } from "../utils";

export default () => {
  // const textAtom = textAtomFamily("new-thread");
  const [text, setText] = useRecoilState(textAtomFamily("new-thread"));
  const [errors, setErrors, handleApiError] = useErrorHandler();
  const [working, setWorking] = useState(false);
  const navigate = useNavigate();

  const onSubmit = useCallback((e) => {
    e.preventDefault();
    setErrors("");
    setWorking(true);

    const form = Object.fromEntries(new FormData(e.target).entries());

    api
      .post("/threads", form)
      .then(({ data }) => {
        navigate(`/thread/${data.thread.slug}`);
        setText("");
      })
      .catch(handleApiError)
      .finally(() => setWorking(false));
  });

  return (
    <Stage>
      <Title>Whatchu got to say?</Title>
      <Content>
        <div className="subhead">
          <strong>
            Think you have something good enough to say to post a thread about
            it? Well have it!
          </strong>{" "}
          Remember that posting a thread is no small thing. Millions of people
          will read it so make it good!
        </div>

        <StyledNewThreadForm onSubmit={onSubmit}>
          <div className="step">
            <h3>Step 1: Pick a category</h3>
            <div className="categories">
              <div className="category">
                <input
                  id="discussion"
                  type="radio"
                  name="category"
                  value="discussion"
                  defaultChecked
                />
                <label htmlFor="discussion">Discussions</label>
              </div>
              <div className="category">
                <input
                  id="project"
                  type="radio"
                  name="category"
                  value="project"
                />
                <label htmlFor="project">Projects</label>
              </div>
              <div className="category">
                <input
                  id="advice"
                  type="radio"
                  name="category"
                  value="advice"
                />
                <label htmlFor="advice">Advice</label>
              </div>
              <div className="category">
                <input
                  id="meaningless"
                  type="radio"
                  name="category"
                  value="meaningless"
                />
                <label htmlFor="meaningless">Meaningless</label>
              </div>
            </div>
            {errors?.category && <div className="error">{errors.category}</div>}
          </div>

          <div className="step">
            <h3>Step 2: Write a thread title</h3>
            <div className="field">
              <input type="text" name="title" />
            </div>
            {errors?.title && <div className="error">{errors.title}</div>}
          </div>

          <div className="step">
            <h3>Step 3: Type the content of your thread</h3>

            <TextEditor
              working={working}
              // textAtom={textAtom}
              textKey="new-thread"
              errors={errors}
            />
          </div>
        </StyledNewThreadForm>
      </Content>
    </Stage>
  );
};

const StyledNewThreadForm = styled.form`
  .step {
    padding: 16px 0;
    border-bottom: 1px dotted #959595;
    width: 100%;

    &:last-of-type {
      border-bottom: 0;
    }

    h3 {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 8px;
    }
  }

  .categories {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 16px;

    .category {
      display: flex;
      align-items: center;
      flex-direction: row;

      &:first-of-type {
        margin-left: 0;
      }

      input {
        margin: 0 5px 0 0;
      }
    }
  }

  .field input {
    font-size: 16px;
    width: 100%;
    max-width: 350px;
    padding: 4px;

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
