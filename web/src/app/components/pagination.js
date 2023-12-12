import React from "react";

import { Link } from "react-router-dom";
import styled from "styled-components";

const Pagination = ({ items, plural, cta, children, path = "" }) => {
  const { page = 1, perPage = 25, total = 0 } = items;

  const totalPages = Math.ceil(total / perPage);
  const setStart = page * perPage - perPage;
  const setEnd = Math.min(setStart + perPage, total);

  const range = (min, max) => {
    return [...Array(max - min + 1).keys()].map((i) => {
      const c = i + min;
      return (
        <Link
          key={i}
          className={`page-link ${page == c ? "active" : ""}`}
          to={`${path}/page/${c}`}
        >
          {c.toLocaleString()}
        </Link>
      );
    });
  };

  let pages = [];

  if (!total || total < perPage) {
    // do nothing, everything is on 1 page
  } else if (totalPages <= 10) {
    // show all pages
    pages = range(1, totalPages);
  } else { // over 10 pages...
    if (page <= 5) {
      pages = [].concat(
        range(1, page + 2),
        [<span key="r1">...</span>],
        range(totalPages - 1, totalPages)
      );
    } else if (page >= totalPages - 4) {
      pages = [].concat(
        range(1, 2),
        [<span key="r1">...</span>],
        range(page - 2, totalPages)
      );
    } else {
      pages = [].concat(
        range(1, 2),
        [<span key="r1">...</span>],
        range(page - 2, page + 2),
        [<span key="r2">...</span>],
        range(totalPages - 1, totalPages)
      );
    }
  }

  return (
    <PaginationView className="pagination">
      {pages}
      <span>
        {(setStart + +!!total).toLocaleString()} - {setEnd.toLocaleString()} of{" "}
        {total.toLocaleString()} {plural}
      </span>
      {children && <div className="message">{children}</div>}
      {cta}
    </PaginationView>
  );
};

export default Pagination;

export const PaginationView = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 3px;
  height: 28px;

  font-size: 8px;
  padding: 16px 0;

  &:first-of-type {
    padding-top: 0;
  }

  border-bottom: 1px dotted #959595;

  .page-link {
    padding: 2px 4px;
    color: #494949;
    border: 1px solid #7e7e7e;
    background: #fff;
    cursor: pointer;
    text-decoration: none;

    &.active {
      color: #fff;
      background: #7e7e7e;
    }

    &:hover {
      color: #fff;
      background: #494949;
    }
  }
  span {
    font-size: 10px;
    color: #7e7e7e;

    &:last-of-type {
      margin-left: 4px;
    }
  }
  .message {
    font-size: 10px;
    color: #7e7e7e;

    a {
      color: #7e7e7e;
      white-space: nowrap;

      &:hover {
        background: #7e7e7e;
        color: #ffffff;
      }
    }
  }

  .cta {
    color: #494949;
    background-color: #e6f7fe;
    padding: 4px;
    text-transform: uppercase;
    font-size: 9px;
    margin-left: auto;

    &:hover {
      background-color: #494949;
      color: #e6f7fe;
    }
  }
`;
