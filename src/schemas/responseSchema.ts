export const aiResponseJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'detected_intent',
    'direct_answer',
    'structured_steps',
    'tabular_data',
    'suggested_next_action',
  ],
  properties: {
    detected_intent: { type: 'string' },
    direct_answer: { type: 'string' },
    structured_steps: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'label', 'done'],
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          done: { type: 'boolean' },
        },
      },
    },
    tabular_data: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
      },
    },
    suggested_next_action: { type: 'string' },
  },
} as const;
