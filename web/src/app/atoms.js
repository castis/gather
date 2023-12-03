import { atom } from "recoil";

export const workingState = atom({
  key: "working",
  default: false,
});

export const replyTextState = atom({
  key: "replyText",
  default: "",
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
