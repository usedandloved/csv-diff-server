const snapshotSchema = {
  type: 'object',
  required: ['source', 'revision'],
  additionalProperties: false,
  properties: {
    dataset: { type: 'string', pattern: '^[A-z0-9]+$' },
    revision: {
      type: 'string',
      pattern: '^[A-z0-9]+$',
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
  required: ['base', 'delta'],
  additionalProperties: false,
  properties: {
    base: snapshotSchema,
    delta: snapshotSchema,
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
  },
};

export { diffParamsSchema };
