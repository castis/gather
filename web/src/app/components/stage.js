import React, { useState, useEffect } from "react";
import styled from "styled-components";

import { Link } from "react-router-dom";

export const Stage = styled.div`
  width: 100%;
`;

export const Title = styled.div`
  height: auto;

  display: flex;
  flex-direction: column;
  justify-content: flex-end;

  padding: 0 0 5px;
  margin-bottom: 16px;

  font-size: 24px;
  font-weight: 700;
  color: #494949;

  border-bottom: 1px dotted #959595;

  @media (min-width: 700px) {
    height: 93px;
  }

  &.editable {
    display: flex;
    flex-direction: row;
    justify-content: start;
    align-items: end;

    form {
      display: flex;
      flex-direction: row;
      align-items: end;
      gap: 5px;
    }

    input {
      color: #494949;
      border: 0;
      border-bottom: 1px dotted #959595;
      padding: 2px 2px 2px 0;

      &:focus {
        outline: none;
      }
    }

    button {
      font-size: 12px;
      color: #494949;
    }

    .error {
      color: #e95e6e;
      font-size: 10px;
    }
  }
`;

export const Content = styled.div`
  color: #7e7e7e;
  width: 100%;

  > .subhead {
    border-bottom: 1px dotted #959595;
    color: #494949;
    padding: 0 0 16px;
    font-size: 12px;

    &.pink {
      color: #ed135a;
    }
  }

  > .error {
    color: #e95e6e;
    background: #fdd3d2;
    margin-bottom: 10px;
    padding: 5px;
    font-size: 12px;
  }

  p {
    font-size: 12px;
    margin-bottom: 15px;

    a {
      color: #7e7e7e;
    }
  }

  .blueline {
    height: 1px;
    width: 100%;
    background-color: #ace1f9;
    box-sizing: content-box
  }

  form {
    display: flex;
    flex-direction: column;
    align-items: start;
    width: 100%;

    font-size: 12px;
    color: #494949;

    > .success {
      color: green;
      width: 100%;
      margin: 12px 0 6px;
    }

    > .error {
      color: #e95e6e;
      width: 100%;
      margin: 12px 0 6px;
    }

    header {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: end;

      margin: 12px 0 6px;
      width: 100%;

      h3 {
        font-weight: 700;
        font-size: 16px;
        margin: 0;
      }
    }

    .field {
      margin: 0 0 10px;
      display: grid;
      grid-template-columns: 50% 50%;
      align-items: start;
      min-height: 20px;

      width: 100%;
      max-width: 400px;

      label {
        margin: 3px 5px 0 0;
      }

      select,
      input[type="checkbox"] {
        margin: auto auto auto 0;
      }

      .error {
        color: #e95e6e;
        font-size: 10px;

        grid-row: 2;
        grid-column: 2;
      }

      .note {
        color: green;
        font-size: 10px;
        grid-row: 2;
        grid-column: 2;
      }

      input:not([type="file"]),
      button,
      textarea {
        border: solid 1px #8f8f9d;
        border-radius: 2px;
        padding: 2px 3px;

        &:focus {
          border-color: #ff9898;
          outline: none;
        }
      }

      textarea {
        width: 100%;
        min-height: 70px;
      }

      .choices {
        // margin: auto auto auto 0;
        display: flex;
        flex-direction: row;
        gap: 10px;

        .choice {
        }
      }
    }
  }
`;

export const NotFound = () => (
  <StyledSkeleton>
    <Title>Not found</Title>
    <Content>
      <p>
        If you're lost, try <Link to="/">going home</Link>.
      </p>
    </Content>
  </StyledSkeleton>
);

export const NotAllowed = () => (
  <StyledSkeleton>
    <Title>Not allowed</Title>
    <Content>
      <p>
        If you're lost, try <Link to="/">going home</Link>.
      </p>
    </Content>
  </StyledSkeleton>
);

export const Error = ({ title, errors }) => {
  return (
    <StyledSkeleton>
      <Title>{title || "This is the error page"}</Title>
      <StyledErrorContent>
        <p>Something in the response said:</p>
        <ul className="errors">
          {Object.keys(errors).map((key) => (
            <li key={key}>{errors[key]}</li>
          ))}
        </ul>
      </StyledErrorContent>
    </StyledSkeleton>
  );
};
const StyledErrorContent = styled(Content)`
  p {
    margin: 0;
    padding: 0;
  }
  .errors {
    margin: 0;
    font-size: 12px;

    li {
      // margin: 0;
      padding: 0;

      color: #e95e6e;
    }
  }
`;

export const Skeleton = () => {
  const [isVisible, setIsVisible] = useState(false);

  // dont show this immediately
  // otherwise it looks like a flash of content
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <StyledSkeleton>
      <Title>
        <div className="bar"></div>
      </Title>
      <Content>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
      </Content>
    </StyledSkeleton>
  );
};

const StyledSkeleton = styled(Stage)`
  @keyframes shimmer {
    0% {
      background-position: 0% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  .bar {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1s infinite linear;

    &:nth-child(2) {
      animation-delay: 0s;
      animation-duration: 0.8s;
    }
    &:nth-child(4) {
      animation-delay: 0.1s;
      animation-duration: 0.9s;
    }
    &:nth-child(1) {
      animation-delay: 0.2s;
      animation-duration: 1s;
    }
    &:nth-child(5) {
      animation-delay: 0.3s;
      animation-duration: 1.1s;
    }
    &:nth-child(3) {
      animation-delay: 0.4s;
      animation-duration: 1.2s;
    }
  }

  ${Title} {
    .bar {
      width: 50%;
      height: 28px;
    }
  }

  ${Content} {
    min-height: 100px;
    display: flex;
    flex-direction: column;
    gap: 10px;

    .bar {
      height: 15px;
    }
  }
`;
