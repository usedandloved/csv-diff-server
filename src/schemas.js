const snapshotSchema = {
  type: 'object',
  required: ['source', 'revision'],
  maxProperties: 3,
  properties: {
    dataset: { type: 'string', pattern: '^[A-z0-9]+$' },
    revision: {
      type: 'string',
      pattern: '^[A-z0-9]+$',
    },
    source: { type: 'string', format: 'uri' },
  },
};

const diffParamsSchema = {
  type: 'object',
  required: ['base', 'delta'],
  maxProperties: 2,
  properties: {
    base: snapshotSchema,
    delta: snapshotSchema,
  },
};

export { diffParamsSchema };
