# Install dependencies only when needed
FROM node:16.10-alpine3.14
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat \
  git \ 
  openssh \
  python3 \
  g++ \
  make

COPY --from=golang:1.17-alpine3.14 /usr/local/go/ /usr/local/go/
ENV PATH="/usr/local/go/bin:${PATH}"
ENV GOPATH /go
ENV PATH $GOPATH/bin:$PATH
RUN mkdir -p "$GOPATH/src" "$GOPATH/bin" && chmod -R 777 "$GOPATH"

RUN go install github.com/aswinkarthik/csvdiff@v1.4.0

WORKDIR /app
ENV NODE_ENV development
EXPOSE 3000
USER 0

COPY ./docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
