import { useMemo } from "react";
import { atom, atomFamily, selectorFamily } from "recoil";

export const workingState = atom({
  key: "working",
  default: false,
});

export const textAtomFamily = atomFamily({
  key: "text-editor",
  default: (key) => localStorage.getItem(key) || "",
  effects: [
    ({ onSet, ...rest }) => {
      onSet((newValue, b, c) => {
        console.log(rest, newValue, b, c)
        // localStorage.setItem(key, newValue);
      });
    },
  ],
});

export const globalKeyState = atom({
  key: "globalKey",
  default: new Date().getTime(),
});

export const initialUser = {
  id: undefined,
  comments_per_page: 25,
  threads_per_page: 25,
  icon: null,
  theme: "light",
  random_titles: false,
  privileged: false,
  html: true,
};

export const buddiesState = atom({
  key: "buddies",
  default: {
    online: [],
    total: 0,
  },
});

export const userState = atom({
  key: "user",
  default: initialUser,
});

export const threadState = atom({
  key: "thread",
  default: {},
});

export const commentsState = atom({
  key: "comments",
  default: {
    items: [],
    total: 0,
    perPage: 25,
  },
});
