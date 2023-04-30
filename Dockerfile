# Build Image
FROM node:18.14.1 AS base

WORKDIR /usr/app

COPY ./package.json ./yarn.lock ./

RUN yarn

COPY ./ .

RUN yarn build

# Runtime Image

FROM node:18.16.0-alpine3.17

WORKDIR /usr/app

ENV NODE_ENV=production

COPY --from=base /usr/app/package.json /usr/app/yarn.lock ./

# Should help reduce the size of /usr/local/share/.cache (hopefully..)
RUN NODE_ENV=production yarn --frozen-lockfile --production && yarn cache clean

COPY --from=base /usr/app/public ./public
COPY --from=base /usr/app/build ./build

USER node

CMD ["yarn", "start"]

# REMEMBER TO RUN `docker build` like this: `DOCKER_BUILDKIT=1 docker build` otherwise,
# it won't copy the permissions correctly (and without error)!
