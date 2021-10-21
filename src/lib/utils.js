import crypto from 'crypto';

// Credit boss man https://github.com/wesbos/waait
const waitSeconds = (amount = 0) =>
  new Promise((resolve) => setTimeout(resolve, amount * 1000));

const stringHash = (string) => {
  return crypto.createHash('sha256').update(string).digest('base64url');
};

const objectHash = (object) => {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(object))
    .digest('base64url');
};

export { waitSeconds, stringHash, objectHash };
