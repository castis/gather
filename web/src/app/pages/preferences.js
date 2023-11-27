import React, { useCallback, useState, useRef } from "react";
import { useRecoilState } from "recoil";

import { api } from "../api";
import { Stage, Title, Content, Skeleton } from "../components/stage";
import { userState } from "../atoms";


import { useErrorHandler } from "../utils";

export default () => {
  const [user, setUser] = useRecoilState(userState);
  const [errors, setErrors, handleApiError] = useErrorHandler("global");
  const [working, setWorking] = useState(false);
  const [complete, setComplete] = useState(false);
  const formRef = useRef();

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();

      setComplete(false);
      setWorking(true);
      setErrors({});

      api
        .post("/preferences", new FormData(e.target), {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then(({ data }) => {
          setUser(data);
          setComplete(true);
          setErrors({});
          formRef.current.reset();
        })
        .catch(handleApiError)
        .finally(() => setWorking(false));
    },
    [user]
  );

  if (!user?.id) {
    return <Skeleton />;
  }

  return (
    <Stage>
      <Title>Pimpin' ain't easy... but editing your profile is!</Title>
      <Content>
        <div className="subhead pink">
          <strong>
            This is the page where you can edit your profile and change your YH
            settings.
          </strong>{" "}
          Your profile lets people learn a little about you. Tweak your YH
          settings to browse yay the way you want to.
        </div>
        <form onSubmit={onSubmit} ref={formRef}>
          {complete && (
            <p className="success">Your preferences have been saved</p>
          )}
          {errors?.global && <div className="error">{errors.global}</div>}

          <header>
            <h3>Account Stuff</h3>
            <button type="submit">
              {working ? "Saving..." : "Save"}
            </button>
          </header>

          <div className="field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              defaultValue={user.email}
              disabled={!!user.email_reset_sent_at}
            />
            {user.email_reset_sent_at && (
              <div className="note">Email reset in progress</div>
            )}
            {errors?.email && <div className="error">{errors.email}</div>}
          </div>

          <div className="field">
            <label htmlFor="password">Original Password</label>
            <input id="password" type="password" name="current_password" />
            {errors?.current_password && <div className="error">{errors.current_password}</div>}
          </div>

          <div className="field">
            <label htmlFor="new_password1">New Password</label>
            <input id="new_password1" type="password" name="new_password1" />
            {errors?.new_password1 && <div className="error">{errors.new_password1}</div>}
          </div>

          <div className="field">
            <label htmlFor="new_password2">Confirm New Password</label>
            <input id="new_password2" type="password" name="new_password2" />
            {errors?.new_password2 && <div className="error">{errors.new_password2}</div>}
          </div>

          <div className="blueline" />

          <header>
            <h3>Personal Stuff</h3>
            <button type="submit">
              {working ? "Saving..." : "Save"}
            </button>
          </header>

          <div className="field">
            <label htmlFor="preferred_name">Whats your name?</label>
            <input
              id="preferred_name"
              type="text"
              name="preferred_name"
              defaultValue={user.preferred_name}
            />
          </div>

          <div className="field">
            <label htmlFor="location">Where ya from?</label>
            <input
              id="location"
              type="text"
              name="location"
              defaultValue={user.location}
            />
          </div>

          <div className="field">
            <label htmlFor="about">Tell us about yourself</label>
            <textarea id="about" name="about" defaultValue={user.about} />
          </div>

          <div className="blueline" />

          <header>
            <h3>Internet Stuff</h3>
            <button type="submit">
              {working ? "Saving..." : "Save"}
            </button>
          </header>

          <div className="field">
            <label htmlFor="flickr">Flickr Username</label>
            <input
              id="flickr"
              type="text"
              name="flickr"
              defaultValue={user.flickr}
            />
          </div>

          <div className="field">
            <label htmlFor="facebook">Facebook</label>
            <input
              id="facebook"
              type="text"
              name="facebook"
              defaultValue={user.facebook}
            />
          </div>

          <div className="field">
            <label htmlFor="instagram">Instagram</label>
            <input
              id="instagram"
              type="text"
              name="instagram"
              defaultValue={user.instagram}
            />
          </div>

          <div className="blueline" />

          <header>
            <h3>Settings</h3>
            <button type="submit" disabled={working}>
              Save
            </button>
          </header>

          <div className="field">
            <label htmlFor="random_titles">Random Titles</label>
            <input
              id="random_titles"
              type="checkbox"
              name="random_titles"
              defaultChecked={!!user.random_titles}
            />
          </div>

          {/* <div className="field">
            <label htmlFor="hide_enemies">Hide Enemy Posts</label>
            <input
              id="hide_enemies"
              type="checkbox"
              name="hide_enemies"
              defaultChecked={!!user.hide_enemies}
            />
          </div> */}

          <div className="field">
            <label htmlFor="threads_per_page">Threads Shown</label>
            <select
              id="threads_per_page"
              name="threads_per_page"
              defaultValue={user.threads_per_page}
            >
              <option>25</option>
              <option>50</option>
              <option>100</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="comments_per_page">Comments Shown</label>
            <select
              id="comments_per_page"
              name="comments_per_page"
              defaultValue={user.comments_per_page}
            >
              <option>25</option>
              <option>50</option>
              <option>100</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="avatar">Avatar</label>
            <input id="avatar" type="file" name="avatar" accept="image/*" />
          </div>
        </form>
      </Content>
    </Stage>
  );
};
