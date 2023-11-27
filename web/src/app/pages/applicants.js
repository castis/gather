import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router";

import { api } from "../api";
import { Stage, Title, Content } from "../components/stage";
import styled from "styled-components";


export default () => {
  const [applicants, setApplicants] = useState();
  const [page, setPage] = useState(1);

  useEffect(() => {
    api
      .get("/applicants", { params: { page } })
      .then((response) => {
        console.log(response)
        if (response) {
          const { data } = response;
          console.log(data)
          setApplicants(data);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }, [page]);

  if (applicants) {
    // const pagination = <Pagination context={threads} />
    return (
      <Stage>
        <Title>Applicants</Title>
        <Content>
          {applicants.items &&
            applicants.items.map((applicant) => {
              return (
                <div key={applicant.id} className="applicant">
                  {applicant.name}
                </div>
              );
            })}
        </Content>
      </Stage>
    );
  }

  return <></>;
};
