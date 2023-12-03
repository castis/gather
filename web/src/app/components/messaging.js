import React, { useState } from "react";

import { Link } from "react-router-dom";
import styled from "styled-components";

import letter from "url:/src/images/chrome/letter.gif";
import greenie from "url:/src/images/chrome/greenie.gif";

export default () => (
  <StyledMessaging className="messaging">
    <div className="inbox">
      <img src={letter} className="icon" />
      <Link to="/messages/inbox">No New Messages</Link>
    </div>
    {/* <div className="applications">
      <img src={greenie} className="icon" />
      <Link to="/applications">50 Applicants</Link>
    </div> */}
  </StyledMessaging>
);
const StyledMessaging = styled.div`
  font-size: 10px;
  padding: 10px 10px 8px;
  background: #fef6ea;

  .inbox {
    margin-bottom: 2px;
  }

  .inbox,
  .applications {
    display: flex;

    .icon {
      margin-right: 8px;
      width: 12px;
      height: 12px;
      display: flex;
      image-rendering: pixelated;

      align-items: center;
      justify-content: center;
    }

    a {
      color: #494949;

      &:hover {
        background: #494949;
        color: #fff;
      }
    }
  }
`;
