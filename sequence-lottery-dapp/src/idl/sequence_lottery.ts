// src/idl/sequence_lottery.ts

export const IDL = {
  version: "0.1.0",
  name: "sequence_lottery",
  instructions: [
    {
      name: "buyTicket",
      accounts: [
        {
          name: "lottery",
          isMut: true,
          isSigner: false,
        },
        {
          name: "ticket",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "ticket",
              },
              {
                kind: "account",
                type: "publicKey",
                path: "lottery",
              },
              {
                kind: "account",
                type: "u64",
                path: "lottery.next_ticket_id",
                account: "Lottery",
              },
            ],
          },
        },
        {
          name: "lotteryVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "buyerTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "buyer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
          address: "11111111111111111111111111111111",
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
          address: "SysvarRent111111111111111111111111111111111",
        },
      ],
      args: [
        {
          name: "sequence",
          type: {
            array: ["u8", 10],
          },
        },
      ],
    },
    {
      name: "claimPrize",
      accounts: [
        {
          name: "lottery",
          isMut: false,
          isSigner: false,
        },
        {
          name: "lotteryAuthority",
          isMut: false,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "lottery",
              },
              {
                kind: "account",
                type: "publicKey",
                path: "lottery",
              },
            ],
          },
        },
        {
          name: "ticket",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lotteryVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "winnerTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "winner",
          isMut: false,
          isSigner: true,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
          address: "11111111111111111111111111111111",
        },
      ],
      args: [],
    },
    {
      name: "initialize",
      accounts: [
        {
          name: "lottery",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "lottery",
              },
              {
                kind: "account",
                type: "publicKey",
                path: "authority",
              },
            ],
          },
        },
        {
          name: "lotteryAuthority",
          isMut: false,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "lottery",
              },
              {
                kind: "account",
                type: "publicKey",
                path: "lottery",
              },
            ],
          },
        },
        {
          name: "lotteryVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
          address: "11111111111111111111111111111111",
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
          address: "SysvarRent111111111111111111111111111111111",
        },
      ],
      args: [
        {
          name: "sequenceLength",
          type: "u8",
        },
        {
          name: "revealInterval",
          type: "i64",
        },
        {
          name: "ticketPrice",
          type: "u64",
        },
        {
          name: "prizeAmount",
          type: "u64",
        },
      ],
    },
    {
      name: "revealNextNumber",
      accounts: [
        {
          name: "lottery",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
          address: "11111111111111111111111111111111",
        },
      ],
      args: [
        {
          name: "randomSeed",
          type: "u64",
        },
      ],
    },
    {
      name: "transferTicket",
      accounts: [
        {
          name: "lottery",
          isMut: false,
          isSigner: false,
        },
        {
          name: "ticket",
          isMut: true,
          isSigner: false,
        },
        {
          name: "currentOwner",
          isMut: false,
          isSigner: true,
        },
        {
          name: "newOwner",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
          address: "11111111111111111111111111111111",
        },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "Lottery",
      type: {
        kind: "struct",
        fields: [
          {
            name: "authority",
            type: "publicKey",
          },
          {
            name: "sequenceLength",
            type: "u8",
          },
          {
            name: "revealInterval",
            type: "i64",
          },
          {
            name: "ticketPrice",
            type: "u64",
          },
          {
            name: "prizeAmount",
            type: "u64",
          },
          {
            name: "nextTicketId",
            type: "u64",
          },
          {
            name: "winningSequence",
            type: {
              array: ["u8", 10],
            },
          },
          {
            name: "currentRevealIndex",
            type: "u8",
          },
          {
            name: "lastRevealTimestamp",
            type: "i64",
          },
          {
            name: "state",
            type: {
              defined: "LotteryState",
            },
          },
        ],
      },
    },
    {
      name: "Ticket",
      type: {
        kind: "struct",
        fields: [
          {
            name: "owner",
            type: "publicKey",
          },
          {
            name: "lottery",
            type: "publicKey",
          },
          {
            name: "ticketId",
            type: "u64",
          },
          {
            name: "sequence",
            type: {
              array: ["u8", 10],
            },
          },
          {
            name: "claimed",
            type: "bool",
          },
        ],
      },
    },
  ],
  types: [
    {
      name: "LotteryState",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Active",
          },
          {
            name: "Completed",
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "InvalidSequenceLength",
      msg: "Invalid sequence length",
    },
    {
      code: 6001,
      name: "InvalidRevealInterval",
      msg: "Invalid reveal interval",
    },
    {
      code: 6002,
      name: "InvalidTicketPrice",
      msg: "Invalid ticket price",
    },
    {
      code: 6003,
      name: "InvalidPrizeAmount",
      msg: "Invalid prize amount",
    },
    {
      code: 6004,
      name: "InvalidSequenceValue",
      msg: "Invalid sequence value",
    },
    {
      code: 6005,
      name: "LotteryClosed",
      msg: "Lottery is closed",
    },
    {
      code: 6006,
      name: "AllNumbersRevealed",
      msg: "All numbers have been revealed",
    },
    {
      code: 6007,
      name: "TooEarlyForReveal",
      msg: "Too early for next reveal",
    },
    {
      code: 6008,
      name: "LotteryNotCompleted",
      msg: "Lottery not completed yet",
    },
    {
      code: 6009,
      name: "AlreadyClaimed",
      msg: "Ticket already claimed",
    },
    {
      code: 6010,
      name: "NotWinningTicket",
      msg: "Not a winning ticket",
    },
    {
      code: 6011,
      name: "NotTicketOwner",
      msg: "Not the ticket owner",
    },
    {
      code: 6012,
      name: "TicketLotteryMismatch",
      msg: "Ticket lottery mismatch",
    },
    {
      code: 6013,
      name: "Unauthorized",
      msg: "Unauthorized",
    },
  ],
};