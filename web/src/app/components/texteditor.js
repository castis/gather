import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import styled from "styled-components";

import { userState, replyTextState } from "../atoms";
import { api } from "../api";

import p11 from "url:/src/images/pinkies/11.gif";
import p01 from "url:/src/images/pinkies/01.gif";
import p05 from "url:/src/images/pinkies/05.gif";
import p07 from "url:/src/images/pinkies/07.gif";
import p08 from "url:/src/images/pinkies/08.gif";
import p14 from "url:/src/images/pinkies/14.gif";
import p10 from "url:/src/images/pinkies/10.gif";
import p03 from "url:/src/images/pinkies/03.gif";
import p17 from "url:/src/images/pinkies/17.gif";
import p16 from "url:/src/images/pinkies/16.gif";
import p27 from "url:/src/images/pinkies/27.gif";
import p22 from "url:/src/images/pinkies/22.gif";
import p24 from "url:/src/images/pinkies/24.gif";
import p09 from "url:/src/images/pinkies/09.gif";
import p06 from "url:/src/images/pinkies/06.gif";
import p20 from "url:/src/images/pinkies/20.gif";
import p18 from "url:/src/images/pinkies/18.gif";
import p25 from "url:/src/images/pinkies/25.gif";
import p23 from "url:/src/images/pinkies/23.gif";
import p26 from "url:/src/images/pinkies/26.gif";
import p21 from "url:/src/images/pinkies/21.gif";

import benice from "url:/src/images/chrome/benice.gif";

export const pinkies = {
  "[:)]": p11,
  "[:(]": p01,
  "[:D]": p05,
  "[;)]": p07,
  "[:P]": p08,
  "[>|]": p14,
  "[:[]": p10,
  "['(]": p03,
  "[:*]": p17,
  "[B-]": p16,
  "[:=]": p27,
  "[:.]": p22,
  "[O]": p24,
  "[8)]": p09,
  "[:{]": p06,
  "[:@]": p20,
  "[%(]": p18,
  "[><]": p25,
  "[RR]": p23,
  "[NH]": p26,
  "[fbm]": p21,
};

const shortcuts = {
  URL: ['<a href="', '"></a>'],
  Image: ['<img src="', '" />'],
  Spoiler: ["<spoiler>", "</spoiler>"],
  Code: ["<code>", "</code>"],
  Snigger: ["<snigger />"],
};

export const TextEditor = ({ working, className, errors }) => {
  const user = useRecoilValue(userState);
  const [text, setText] = useRecoilState(replyTextState);
  const [caret, setCaret] = useState(0);
  const textareaRef = useRef();

  useEffect(() => {
    textareaRef?.current.setSelectionRange(caret, caret);
  }, [caret]);

  useEffect(() => {
    if (text.length > 0) {
      textareaRef?.current.scrollIntoView();
    }
  }, [text]);

  const insert = useCallback((newText, advanceCaret) => {
    const { current: textarea } = textareaRef;

    setText(
      text.substring(0, textarea.selectionStart) +
        newText +
        text.substring(textarea.selectionEnd)
    );

    setCaret(textarea.selectionStart + advanceCaret);

    textarea.focus();
  });

  const shortcut = useCallback((e) => {
    const { current: textarea } = textareaRef;
    const tag = shortcuts[e.target.dataset.id];
    let advanceCaret = tag[0].length;

    // if any text is selected, splice it into position 1
    // and advance the caret that much
    if (textarea.selectionStart !== textarea.selectionEnd) {
      const wrappable = text.substring(
        textarea.selectionStart,
        textarea.selectionEnd
      );

      tag.splice(1, 0, wrappable);
      advanceCaret += wrappable.length;
    }

    insert(tag.join(""), advanceCaret);
  });

  const pinkie = useCallback((e) => {
    const newText = e.target.getAttribute("title");
    insert(newText, newText.length);
  });

  useEffect(() => {
    if (window.location.hash == "#bottom" && textareaRef?.current) {
      textareaRef.current.scrollIntoView({
        behavior: "instant",
        block: "center",
      });
    }
  }, [window.location.hash, textareaRef?.current]);

  const handleTextarea = useCallback((e) => setText(e.target.value));

  return (
    <StyledTextEditor className={className}>
      <h3>Post a Reply</h3>
      <div className="shortcuts">
        <h5>SHORTCUTS!</h5>
        <ul>
          {Object.keys(shortcuts).map((k, i) => (
            <li key={i} onClick={shortcut} data-id={k}>
              {k}
            </li>
          ))}
        </ul>
      </div>
      <div className="pinkie-bank">
        {Object.keys(pinkies).map((k, i) => (
          <a key={i} onClick={pinkie}>
            <img src={pinkies[k]} title={k} />
          </a>
        ))}
      </div>
      <div className="big-input">
        <div className="benice">
          <textarea
            name="content"
            ref={textareaRef}
            onChange={handleTextarea}
            value={text}
            disabled={working}
          />
          <img src={benice} title="OR ELSE" />
        </div>
        {errors?.content && <div className="error">{errors.content}</div>}
        <p>
          I, {user.name}, do solemnly swear that in posting this comment I
          promise to be nice.
        </p>
        <div className="commands">
          <button type="submit" disabled={working}>
            Agree & Post
          </button>
          {/* <button onClick={onPreview}>Preview</button> */}
        </div>
      </div>
    </StyledTextEditor>
  );
};

const StyledTextEditor = styled.div`
  max-width: 100%;
  display: grid;
  grid-template-columns: 85px auto;
  grid-template-rows: minmax(15px, auto) auto;
  grid-column-gap: 35px;
  grid-row-gap: 10px;
  margin-right: auto;

  &.new-thread {
    grid-template-columns: min-content 65px;

    margin-right: auto;
    h3 {
      display: none;
    }
    .shortcuts {
      grid-column: 2;
      margin-left: -65px;
    }
    .pinkie-bank {
      grid-column: 1/3;
    }
    .big-input {
      grid-column: 1;
    }
  }

  h3 {
    grid-column: 1;
    grid-row: 1;

    font-size: 14px;
  }

  .shortcuts {
    grid-column: 1;
    grid-row: 2;

    background: #f4f4f4;
    border: 1px dotted #8a8a8a;
    padding: 5px;
    margin-bottom: auto;

    font-size: 9px;

    h5 {
      margin: 0;
      font-weight: 500;
      font-size: 9px;
    }

    ul {
      margin: 0;
      padding: 0 0 0 10px;

      li {
        margin: 3px 0;
        color: #ed135a;
        cursor: pointer;

        &:hover {
          color: #fff;
          background: #ed135a;
        }
      }
    }
  }

  .pinkie-bank {
    grid-column: 2;
    grid-row: 1;

    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 3px;

    a {
      cursor: pointer;

      img {
        image-rendering: pixelated;
      }
    }
  }

  .big-input {
    grid-column: 2;
    grid-row: 2;
    overflow-y: hidden;

    p {
      font-weight: 700;
      margin: 8px 0 9px;
    }

    .benice {
      display: flex;
      width: 100%;

      img {
        margin: auto 0 10px -10px;
        image-rendering: pixelated;
      }
    }

    textarea {
      width: 450px;
      height: 180px;
      border: solid 1px #8f8f9d;
      border-radius: 3px;
      padding: 2px 3px;
      transition: border-color 0.3s ease-in-out;
      z-index: 1;

      &:focus {
        border-color: #ff9898;
        outline: none;
      }
    }
    
    .error {
      color: #e95e6e;
      font-size: 10px;
      margin: 0 0 10px;
    }

    .commands {
      display: flex;
      gap: 4px;
    }
  }
`;
