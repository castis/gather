import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router";

import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { Stage, Title, Content } from "../../components/stage";
import styled from "styled-components";
import { TextEditor } from "../../components/texteditor";
import { useErrorHandler } from "../../utils";

const MessageCompositor = () => {
  const { user } = useParams();
  const [errors, setErrors, handleApiError] = useErrorHandler("user");
  const [working, setWorking] = useState(false);
  const navigate = useNavigate();

  const onSend = (e) => {
    e.preventDefault();
    setErrors({});
    setWorking(true);

    const form = Object.fromEntries(new FormData(e.target).entries());
    api
      .post("/messages/send", form)
      .then(({ data }) => {
        navigate(`/messages/message/${data.slug}`);
      })
      .catch(handleApiError)
      .finally(() => setWorking(false));
  };

  return (
    <Stage>
      <Title>Send a message</Title>
      <Content>
        <div className="subhead">
          Send a message to another member. Remember, if you don't recieve a
          reply it may not be that you're being ignored, most people don't check
          their message very often.
        </div>

        <StyledNewMessageForm onSubmit={onSend} className="reply-form">
          <div className="step">
            <h3>Step 1: Pick a recipient</h3>
            <div className="field">
              <input type="text" name="user" defaultValue={user} />
              {errors?.user && <div className="error">{errors.user}</div>}
            </div>
          </div>

          <div className="step">
            <h3>Step 2: Write a title</h3>
            <div className="field">
              <input type="text" name="title" />
              {errors?.title && <div className="error">{errors.title}</div>}
            </div>
          </div>

          <div className="step">
            <h3>Step 3: Write a message</h3>
            <TextEditor working={working} className="new-thread" />
          </div>
        </StyledNewMessageForm>
      </Content>
    </Stage>
  );
};

export default MessageCompositor;

const StyledNewMessageForm = styled.form`
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
