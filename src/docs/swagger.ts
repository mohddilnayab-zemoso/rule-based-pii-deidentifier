export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Rule-Based Text De-identification Service',
    version: '1.0.0',
    description:
      'Deterministic PII detection and redaction service using regex and algorithmic validators.',
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check endpoint',
        responses: {
          200: { description: 'Service is healthy' },
        },
      },
    },
    '/deidentify': {
      post: {
        summary: 'Detect and redact PII entities from free-form text',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['text'],
                properties: {
                  text: {
                    type: 'string',
                    example:
                      'Patient John Doe can be contacted at john.doe@example.com or +1-415-555-0134. DOB: 1990-05-12.',
                  },
                  entities: {
                    type: 'array',
                    items: {
                      type: 'string',
                      enum: [
                        'EMAIL',
                        'PHONE',
                        'SSN',
                        'DATE_OF_BIRTH',
                        'CREDIT_CARD',
                        'IP_ADDRESS',
                        'NAME',
                      ],
                    },
                    example: ['EMAIL', 'PHONE', 'DATE_OF_BIRTH'],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Successfully de-identified text',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    deidentifiedText: { type: 'string' },
                    entitiesDetected: {
                      type: 'object',
                      additionalProperties: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Invalid input payload or unsupported entity type' },
        },
      },
    },
    // batch 
    // '/deidentify/batch': {
    //   post: {
    //     summary: 'Batch de-identify multiple text records in one request',
    //     requestBody: {
    //       required: true,
    //       content: {
    //         'application/json': {
    //           schema: {
    //             type: 'object',
    //             required: ['records'],
    //             properties: {
    //               records: {
    //                 type: 'array',
    //                 items: { type: 'string' },
    //                 example: [
    //                   'Patient Name: Jane Doe | Email: jane@example.com',
    //                   'Server IP: 192.168.1.10 | Phone: +91 98765 43210',
    //                 ],
    //               },
    //               entities: {
    //                 type: 'array',
    //                 items: {
    //                   type: 'string',
    //                   enum: [
    //                     'EMAIL',
    //                     'PHONE',
    //                     'SSN',
    //                     'DATE_OF_BIRTH',
    //                     'CREDIT_CARD',
    //                     'IP_ADDRESS',
    //                     'NAME',
    //                   ],
    //                 },
    //                 example: ['NAME', 'EMAIL', 'IP_ADDRESS', 'PHONE'],
    //               },
    //             },
    //           },
    //         },
    //       },
    //     },
    //     responses: {
    //       200: { description: 'Successfully de-identified batch records' },
    //       400: { description: 'Invalid batch payload or unsupported entity type' },
    //     },
    //   },
    // },
    // batch 
  },
};