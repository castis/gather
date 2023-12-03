# Gather

Messageboard software.

### Prerequisites to run locally

1. git
2. docker

## Start here

There are 2 main parts: an API and a web application.

1. The API is a [flask](https://flask.palletsprojects.com/en/3.0.x/) app that serves data from [postgres](https://www.postgresql.org) with help from [redis](https://redis.io).
2. The web application is [react](https://react.dev) and is built with [parcel](https://parceljs.org).

### Setup

1. Clone this repo
2. `cd` into the repo
3. Run `docker-compose up`
4. Open http://localhost:1234

### Running separately

If you're setting this up for the first time, use `make api` to get to a bash prompt where you can run `flask db upgrade` to setup the database.

Afterwards, you should be able to use `docker-compose up`. This will start the api at http://localhost:5000 and a parcel dev server that serves the web app at http://localhost:1234.

### Run separately

#### API

Use `make api` to get inside the API container where we're using [flask](https://flask.palletsprojects.com/en/2.2.x/) to build the API.

Start the flask dev app at http://localhost:5000 with `flask run`.

#### Web

Use `make web` to get inside the node container where we're using [yarn](https://yarnpkg.com/) to manage dependencies, and [parcel](https://parceljs.org/) to build the [react](https://reactjs.org/) application:

Start the parcel dev server at http://localhost:1234 by running `parcel`.

### External services

Email and YH3 capabilities are only enabled once you've created the file `./api/.env` with the following contents.

```
YH3_USERNAME=...
YH3_PASSWORD=...
```

Emails are sent via [SES](https://aws.amazon.com/ses/)

### Production

This application is hosted on AWS.

#### Infrastructure

- The API image is built and pushed to [ECR](https://aws.amazon.com/ecr/) and run on [ECS](https://aws.amazon.com/ecs/).
- The web app is built and pushed to [S3](https://aws.amazon.com/s3/) and served via [CloudFront](https://aws.amazon.com/cloudfront/).
- Storage is hosted on [RDS](https://aws.amazon.com/rds/) and [ElastiCache](https://aws.amazon.com/elasticache/).
