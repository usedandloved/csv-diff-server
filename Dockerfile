# - - - - - - - - - - - - - - - - - - - - - 
# Install
# Install packages and npm
# - - - - - - - - - - - - - - - - - - - - - 
FROM node:16.10-alpine3.14 AS deps

WORKDIR /app

RUN apk add --no-cache libc6-compat \
  python3 \
  g++ \
  make

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

COPY --from=golang:1.17-alpine3.14 /usr/local/go/ /usr/local/go/
ENV PATH="/usr/local/go/bin:${PATH}"
ENV GOPATH /go
ENV PATH $GOPATH/bin:$PATH
RUN mkdir -p "$GOPATH/src" "$GOPATH/bin" && chmod -R 777 "$GOPATH"

RUN go install github.com/aswinkarthik/csvdiff@v1.4.0

RUN addgroup -g 1001 -S nodejs && \
  adduser -S ualuser -u 1001 && \
  chown -R ualuser src && \
  chown -R ualuser $GOPATH && \
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
