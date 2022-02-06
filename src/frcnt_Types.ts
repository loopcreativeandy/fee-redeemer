export type Frcnt = {
  "version": "0.1.0",
  "name": "frcnt",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "feecntrAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "count",
      "accounts": [
        {
          "name": "feecntrAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "instructionSysvarAccount",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "feeCounter",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "closedAccounts",
            "type": "u64"
          }
        ]
      }
    }
  ]
};

export const IDL: Frcnt = {
  "version": "0.1.0",
  "name": "frcnt",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "feecntrAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "count",
      "accounts": [
        {
          "name": "feecntrAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "instructionSysvarAccount",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "feeCounter",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "closedAccounts",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
