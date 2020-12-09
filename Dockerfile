# DEV
FROM node:14-alpine as base-stage
WORKDIR /usr/app
COPY package.json yarn.lock ./
RUN apk update \
&& apk add --no-cache git\
&& yarn install --frozen-lockfile && yarn cache clean
EXPOSE 3000

# BUILD
FROM base-stage as build-stage
COPY . .
RUN yarn build \
    && npm prune --production \
    && yarn cache clean \
    && yarn autoclean --force \
    # delete all test and declaration files during the build process
    && find build -type f -name '*.d.ts' -o -name '*.test.*' -delete

# PROD 
# FROM nginx:1.18.0-alpine
# WORKDIR /usr/app
# COPY --from=build-stage /usr/app/build /usr/share/nginx/html
# # COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]

FROM node:14-alpine
WORKDIR /usr/app
COPY --from=build-stage /usr/app/build /usr/app
COPY --from=build-stage /usr/app/.env /usr/app/.env
COPY --from=build-stage /usr/app/node_modules /usr/node_modules
EXPOSE 8080
ENV NODE_PATH=.
CMD [ "node" , "index.js"]