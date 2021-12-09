import ecsFormat from '@elastic/ecs-pino-format';
import fetch from 'node-fetch';
import pino from 'pino';

const envId = process.env.SELF_DOMAIN || process.env.NODE_ENV;

// let pinoOptions = { level: 'info' };
let pinoOptions = {
  level: 'debug',
  hooks: {
    logMethod(inputArgs, method, level) {
      if (
        'local' === process.env.LOG_MODE &&
        20 === level &&
        ['awin'].includes(inputArgs[0]?.controller)
      ) {
        // Don't show debug in local.
        // return null;
      }
      if (
        'local' !== process.env.LOG_MODE &&
        level >= 50 &&
        process.env.SLACK_WEBHOOK_URL_LOGS
      ) {
        // Send slack alert.
        fetch(process.env.SLACK_WEBHOOK_URL_LOGS, {
          method: 'post',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `💩 New error on runner ${envId}: \n ${JSON.stringify(
              inputArgs,
              null,
              2
            )}`,
          }),
        });
      }
      return method.apply(this, inputArgs);
    },
  },
};

if ('local' === process.env.LOG_MODE) {
  // pinoOptions = {
  //   ...pinoOptions,
  // };
} else {
  pinoOptions = { ...ecsFormat(), ...pinoOptions };
}

const logger = pino(pinoOptions);

export { logger };
