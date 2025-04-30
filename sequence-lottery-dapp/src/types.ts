// src/types.ts
import { PublicKey } from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor'

export type Lottery = {
  publicKey: PublicKey
  authority: PublicKey
  sequenceLength: number
  revealInterval: anchor.BN
  ticketPrice: anchor.BN
  prizeAmount: anchor.BN
  nextTicketId: anchor.BN
  winningSequence: number[]
  currentRevealIndex: number
  lastRevealTimestamp: anchor.BN
  state: LotteryState
}

export type Ticket = {
  publicKey: PublicKey
  owner: PublicKey
  lottery: PublicKey
  ticketId: anchor.BN
  sequence: number[]
  claimed: boolean
}

export type LotteryState = {
  active?: {}
  completed?: {}
} | null