# Build Image
FROM node:18.14.1 AS base

WORKDIR /usr/app

COPY ./package.json ./yarn.lock ./

RUN yarn

COPY ./ .

RUN yarn build

# Runtime Image

FROM node:18.14.1-alpine3.17

WORKDIR /usr/app

COPY --from=base /usr/app/package.json /usr/app/yarn.lock ./

RUN yarn --prod

COPY --from=base /usr/app/public ./public
COPY --from=base /usr/app/build ./build
COPY --from=base --chmod=777 /usr/app/migrations ./migrations
RUN chmod -R 777 /usr/app/migrations

ENV NODE_ENV=production

USER node

CMD ["npm", "run", "start"]

# REMEMBER TO RUN `docker build` like this: `DOCKER_BUILDKIT=1 docker build` otherwise,
# it won't copy the permissions correctly (and without error)!
