import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom"
import { api } from "../api"
import { Stage, Title, Content } from "../components/stage";
import * as d3 from "d3";
// import { Link, useParams } from "react-router-dom";
// import { useRecoilState } from "recoil";
import styled from "styled-components";

// import { formatPoint } from "./home";

import { extent, max } from "d3-array";
import { axisBottom, axisLeft } from "d3-axis";
import { scaleLinear, scaleUtc } from "d3-scale";
import { line } from "d3-shape";
import { utcFormat } from "d3-time-format";
import { draw } from "./statistics"
// import { Dropdown, timespans, url } from "../utils";
// import { newAtom } from "../atoms";

// import Comments from "../components/comments";
// import { processComments } from "./company";

let parseTime = d3.timeParse("%Y-%m-%dT%H:%M:%S");

export const formatPoint = (i) => ({
  date: parseTime(i.t),
  value: i.v,
});


export default () => {
  const { slug } = useParams();
  // const user = useRecoilValue(userState);
  // const navigate = useNavigate();
  const [thread, setThread] = useState({});
  const [comments, setComments] = useState([]);

  const someRef = useRef(null);

  useEffect(() => {
    if (comments.length && someRef.current) {
      draw(comments, someRef);
    }
  }, [comments, someRef]);

  useEffect(() => {
    api
      .get(`/threads/statistics`, { params: { slug } })
      .then(({ data }) => {
        console.log(data)
        setThread(data.thread);
        setComments(
          Object.values(data.comments).map((entry) => ({
            date: parseTime(entry.date),
            value: entry.value,
          }))
        );
      })
      // .catch(console.error);
  }, [slug]);

  if (!thread?.id) {
    return null;
  }

  return (
    <Stage>
      <Title>{thread.title}</Title>
      <StyledContent>
        <svg
          ref={someRef}
          viewBox={`0 0 600 338`}
          preserveAspectRatio="xMidYMid meet"
        />
      </StyledContent>
    </Stage>
  )
};

const StyledContent = styled(Content)`
  max-width: 600px;
  padding-top: 

  svg {
    aspect-ratio: 16/9;
    width: 100%;

    border: solid 1px green;;

    g {
      border: solid 1px pink;
    }
  }
`

// export const formState = newAtom("personFormState", {
//   sort: "comment_count",
//   dir: "asc",
//   page: 1,
//   // timespan: "1h",
// });

// export default Person = () => {
//   const [form, setForm] = useState({
//     sort: "comment_count",
//     dir: "asc",
//     page: 1,
//     // timespan: "1h",
//   });
//   // const [form, setForm] = useRecoilState(formState);
//   const [person, setPerson] = useState({});
//   const [mentions, setMentions] = useState([]);

//   const [comments, setComments] = useState({
//     items: [],
//     total: 0,
//     per_page: 0,
//     page: 0,
//   });

//   const params = useParams();

//   const pageSelect = (page) => setForm({ ...form, page });

//   useEffect(() => {
//     fetch(`${url}/people/${params.id}?` + new URLSearchParams(form))
//       .then((response) => response.json())
//       .then(({ info, comments }) => {
//         if (info && comments) {
//           setPerson(info);
//           setComments({
//             ...comments,
//             items: processComments(comments.items),
//           });
//         }
//       });
//   }, [form.page]);

//   const pagination = (
//     <Pagination items={comments} plural="comments" pageSelect={pageSelect} />
//   );

//   return (
//     <div className="page">
//       <div className="header">
//         <h1>{person.name}</h1>
//       </div>

//       <PersonActivity />

//       <div className="card">
//         <div className="header">
//           <h2>Recent Comments</h2>
//         </div>

//         {pagination}
//         <Comments items={comments.items} />
//         {pagination}
//       </div>
//     </div>
//   );
// };
