import React, { useState, useEffect } from "react";
import * as ReactDOM from "react-dom/client";
import axios from "axios";
import {
  Routes,
  Route,
  // Outlet,
  // Navigate,
  // useLocation,
  BrowserRouter,
} from "react-router-dom";
import styled from "styled-components";

import { ThemeProvider } from "styled-components";
import { RecoilRoot, useRecoilState, useRecoilValue } from "recoil";

import Toolbar from "./app/components/toolbar";

// import Statistics from "./app/pages/statistics";
import { Join, Joining } from "./app/pages/join";
import PasswordReset from "./app/pages/password_reset";
import EmailVerification from "./app/pages/email_verification";
import Preferences from "./app/pages/preferences";
import NewThread from "./app/pages/newthread";
import Threads from "./app/pages/threads";
import Thread from "./app/pages/thread";
import ThreadStats from "./app/pages/threadstats";
import Users from "./app/pages/users";
import User from "./app/pages/user";
import Buddies from "./app/pages/buddies";


import { Inbox, Sent } from "./app/pages/messages/inbox";
import ComposeMessage from "./app/pages/messages/compose";

import { userState } from "./app/atoms";
import { NotFound } from "./app/components/stage";

const App = () => {
  const { theme: name } = useRecoilValue(userState);
  return (
    <ThemeProvider theme={{ name }}>
      <StyledContainer>
        <Toolbar />
        <Routes>
          {/* <Route path="/statistics" element={<Statistics />} /> */}
          <Route path="/join" element={<Join />} />
          <Route path="/join/:code" element={<Joining />} />
          <Route path="/new_password/:token" element={<PasswordReset />} />
          <Route path="/verify_email/:token" element={<EmailVerification />} />

          <Route path="/thread/:slug/stats" element={<ThreadStats />} />
          <Route path="/thread/:slug/page?/:page?" element={<Thread />} />

          <Route path="/users/:filter?/page?/:page?" element={<Users />} />
          <Route path="/user/:name" element={<User />} />
          <Route path="/buddies/:name?" element={<Buddies />} />

          <Route path="/newthread" element={<NewThread />} />
          <Route path="/preferences" element={<Preferences />} />

          <Route path="/messages">
            <Route path="/messages/inbox/:page?" element={<Inbox />} />
            <Route path="/messages/sent/:page?" element={<Sent />} />
            <Route
              path="/messages/write/:user?"
              element={<ComposeMessage />}
            />
          </Route>

          <Route path="/" element={<Threads />}>
            <Route path="page/:page" />
            <Route path="sort/:sort" >
              <Route path="page/:page" />
            </Route>
            <Route path=":type/:identifier" >
              <Route path="sort/:sort" >
                <Route path="page/:page" />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </StyledContainer>
    </ThemeProvider>
  );
};

ReactDOM.createRoot(document.getElementById("app")).render(
  <RecoilRoot>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </RecoilRoot>
);

const StyledContainer = styled.div`
  display: grid;
  grid-template-rows: 40px auto;
  grid-template-columns: 100%;
  grid-column-gap: 15px;
  padding: 10px;

  @media (min-width: 700px) {
    padding: 25px 25px;
    grid-template-rows: 100%;
    grid-template-columns: 200px auto;
  }
`;
