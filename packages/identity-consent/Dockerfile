# Stage 1 - building node_modules and dist folder
FROM node:12-alpine as builder
RUN apk add python make g++ && apk update
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
# Stage 2
FROM node:12-alpine
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY --from=builder node_modules node_modules
COPY --from=builder dist dist
COPY --from=builder views views
COPY --from=builder images images
COPY package*.json ./
RUN npm prune --production && \
  mkdir log && \
  chown -R node:node log
USER node
ENV NODE_ENV production
CMD [ "node", "dist/main.js" ]
