# - - - - - - - - - - - - - - - - - - - - - 
# Install
# Install packages and npm
# - - - - - - - - - - - - - - - - - - - - - 
FROM node:16.10-alpine3.14 AS deps

WORKDIR /app

# production as default value
ENV NODE_ENV production

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

RUN addgroup -g 1001 -S nodejs && \
  adduser -S ualuser -u 1001

# - - - - - - - - - - - - - - - - - - - - - 
# Production image, copy all the files and
# run the app
# - - - - - - - - - - - - - - - - - - - - - 
FROM node:16-alpine3.14 AS server

WORKDIR /app

# production as default value
ENV NODE_ENV production

COPY /src ./src

RUN addgroup -g 1001 -S nodejs && \
  adduser -S ualuser -u 1001 && \
  chown -R ualuser src && \
  mkdir repo && \
  chown -R ualuser repo

USER ualuser

COPY --from=deps --chown=ualuser:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=ualuser:nodejs /app/package.json ./package.json

# Add a text file for debugging
# ARG image_version
# RUN echo $image_version > ./src/static/image-version.html

EXPOSE 3000

CMD ["yarn", "start"]
