#!/usr/bin/env bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
CONTAINER_NAME=csv-diff-server-test
JEST_WATCH=false

# Is the watch flag passed to the script?
while getopts w flag
do
  case "${flag}" in
    w) JEST_WATCH=true;;
  esac
done

# Start app
cd $SCRIPT_DIR/.. && docker build -t ${CONTAINER_NAME} -f $SCRIPT_DIR/../dev.Dockerfile .

docker run -d --rm -t \
  --name "${CONTAINER_NAME}" \
  -v=$SCRIPT_DIR/../:/app \
  -v=csv_diff_server_node_modules:/app/node_modules \
  --env-file=$SCRIPT_DIR/.env \
  -e APP_ENV=test \
  -w=/app \
  -p3000:3000 \
  --entrypoint /bin/ash \
  ${CONTAINER_NAME}

if $JEST_WATCH; then
  # Run jest in watch mode
  docker exec \
    -i "${CONTAINER_NAME}" \
    sh -c 'cd /app && yarn install &&  yarn test:watch'

  # Only stop the container after jest has been quit 
  docker stop "${CONTAINER_NAME}"
else
  # Always stop container, but exit with 1 when tests are failing
  if docker exec \
    -i "${CONTAINER_NAME}" \
    sh -c 'cd /app && yarn install &&  yarn test';then
      docker stop "${CONTAINER_NAME}"
  else
       docker stop "${CONTAINER_NAME}" && exit 1
  fi
fi
