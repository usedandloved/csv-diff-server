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

const msToTime = (s) => {
  // Pad to 2 or 3 digits, default is 2
  var pad = (n, z = 2) => ('00' + n).slice(-z);
  return (
    pad((s / 3.6e6) | 0) +
    ':' +
    pad(((s % 3.6e6) / 6e4) | 0) +
    ':' +
    pad(((s % 6e4) / 1000) | 0) +
    '.' +
    pad(s % 1000, 3)
  );
};

export { waitSeconds, stringHash, objectHash, msToTime };
