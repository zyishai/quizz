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
COPY --from=base /usr/app/public ./public
COPY --from=base /usr/app/build ./build

RUN yarn --prod

ENV NODE_ENV=production

USER node

CMD ["npm", "run", "start"]
