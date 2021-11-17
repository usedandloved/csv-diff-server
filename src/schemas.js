const snapshotSchema = {
  type: 'object',
  required: ['revision'],
  additionalProperties: false,
  properties: {
    dataset: { type: 'string', pattern: '^[A-z0-9-]+$' },
    revision: {
      type: 'string',
      pattern: /^[A-z0-9\s\:\-]+$/,
    },
    source: { type: 'string', format: 'uri' },
  },
};

const integersSchema = {
  type: 'string',
  pattern: /^\d+(,\d+)*$/,
};

const diffParamsSchema = {
  type: 'object',
  required: ['base'],
  additionalProperties: false,
  properties: {
    base: snapshotSchema,
    delta: snapshotSchema,
    preProcess: {
      type: 'object',
      properties: {
        headers: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    },
    flags: {
      type: 'object',
      additionalProperties: false,
      properties: {
        columns: integersSchema,
        'ignore-columns': integersSchema,
        include: integersSchema,
        'primary-key': integersSchema,
        separator: { type: 'string', maxLength: 2 },
        time: { type: 'boolean' },
        lazyquotes: { type: 'boolean' },
        format: {
          type: 'string',
          enum: [
            'rowmark',
            'json',
            'legacy-json',
            'diff',
            'word-diff',
            'color-words',
          ],
        },
      },
    },
    postProcess: {
      type: 'object',
      properties: {
        batchSize: { type: 'integer', minimum: 1 },
      },
    },
  },
};

export { diffParamsSchema };
