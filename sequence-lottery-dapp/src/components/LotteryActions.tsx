import React, { useState } from 'react'
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
} from '@mui/material'
import { useLottery } from '../contexts/LotteryContext'
import { PublicKey } from '@solana/web3.js'
import { WalletButton } from './WalletButton'

export const LotteryActions = () => {
  const {
    lottery,
    loading,
    error,
    initializeLottery,
    buyTicket,
    revealNextNumber,
    claimPrize,
    transferTicket,
    refreshData,
  } = useLottery()

  const [initParams, setInitParams] = useState({
    sequenceLength: 5,
    revealInterval: 60,
    ticketPrice: 1000000, // 1 USDC (assuming 6 decimals)
    prizeAmount: 50000000, // 50 USDC
  })

  const [ticketSequence, setTicketSequence] = useState<number[]>([1, 2, 3, 4, 5])
  const [randomSeed, setRandomSeed] = useState<number>(Math.floor(Math.random() * 10000))
  const [ticketToClaim, setTicketToClaim] = useState<number | null>(null)
  const [transferData, setTransferData] = useState({
    ticketId: '',
    newOwner: '',
  })

  const handleInitSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await initializeLottery(
      initParams.sequenceLength,
      initParams.revealInterval,
      initParams.ticketPrice,
      initParams.prizeAmount
    )
  }

  const handleBuyTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (ticketSequence.length !== lottery?.sequenceLength) {
      alert(`Please enter exactly ${lottery?.sequenceLength} numbers`)
      return
    }
    await buyTicket(ticketSequence)
  }

  const handleRevealNumber = async (e: React.FormEvent) => {
    e.preventDefault()
    await revealNextNumber(randomSeed)
  }

  const handleClaimPrize = async (ticketId: number) => {
    await claimPrize(ticketId)
  }

  const handleTransferTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const newOwnerPubkey = new PublicKey(transferData.newOwner)
      await transferTicket(parseInt(transferData.ticketId), newOwnerPubkey)
      setTransferData({ ticketId: '', newOwner: '' })
    } catch (err) {
      alert('Invalid public key')
    }
  }

  const handleSequenceChange = (index: number, value: number) => {
    const newSequence = [...ticketSequence]
    newSequence[index] = value
    setTicketSequence(newSequence)
  }

  return (
    <Box sx={{ p: 3 }}>
      <WalletButton />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Lottery Info */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Lottery Information
            </Typography>
            {lottery ? (
              <Box>
                <Typography>
                  <strong>Status:</strong> {lottery.state}
                </Typography>
                <Typography>
                  <strong>Sequence Length:</strong> {lottery.sequenceLength}
                </Typography>
                <Typography>
                  <strong>Reveal Interval:</strong> {lottery.revealInterval} seconds
                </Typography>
                <Typography>
                  <strong>Ticket Price:</strong> {lottery.ticketPrice / 1000000} USDC
                </Typography>
                <Typography>
                  <strong>Prize Amount:</strong> {lottery.prizeAmount / 1000000} USDC
                </Typography>
                <Typography>
                  <strong>Next Ticket ID:</strong> {lottery.nextTicketId}
                </Typography>
                <Typography>
                  <strong>Current Reveal Index:</strong> {lottery.currentRevealIndex}/
                  {lottery.sequenceLength}
                </Typography>
                {lottery.currentRevealIndex > 0 && (
                  <Box mt={2}>
                    <Typography variant="h6">Winning Sequence:</Typography>
                    <Box display="flex" gap={1}>
                      {lottery.winningSequence
                        .slice(0, lottery.sequenceLength)
                        .map((num, idx) => (
                          <Paper
                            key={idx}
                            sx={{
                              p: 1,
                              minWidth: 40,
                              textAlign: 'center',
                              backgroundColor:
                                idx < lottery.currentRevealIndex
                                  ? '#4caf50'
                                  : '#f5f5f5',
                              color:
                                idx < lottery.currentRevealIndex ? 'white' : 'inherit',
                            }}
                          >
                            {idx < lottery.currentRevealIndex ? num : '?'}
                          </Paper>
                        ))}
                    </Box>
                  </Box>
                )}
                <Button
                  variant="contained"
                  onClick={refreshData}
                  sx={{ mt: 2 }}
                  disabled={loading}
                >
                  Refresh Data
                </Button>
              </Box>
            ) : (
              <Typography>No lottery initialized</Typography>
            )}
          </Paper>
        </Grid>

        {/* Actions */}
        <Grid item xs={12} md={6}>
          {!lottery ? (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Initialize Lottery
              </Typography>
              <form onSubmit={handleInitSubmit}>
                <TextField
                  label="Sequence Length (1-10)"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={initParams.sequenceLength}
                  onChange={(e) =>
                    setInitParams({
                      ...initParams,
                      sequenceLength: parseInt(e.target.value),
                    })
                  }
                  inputProps={{ min: 1, max: 10 }}
                />
                <TextField
                  label="Reveal Interval (seconds)"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={initParams.revealInterval}
                  onChange={(e) =>
                    setInitParams({
                      ...initParams,
                      revealInterval: parseInt(e.target.value),
                    })
                  }
                />
                <TextField
                  label="Ticket Price (USDC)"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={initParams.ticketPrice / 1000000}
                  onChange={(e) =>
                    setInitParams({
                      ...initParams,
                      ticketPrice: parseFloat(e.target.value) * 1000000,
                    })
                  }
                />
                <TextField
                  label="Prize Amount (USDC)"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={initParams.prizeAmount / 1000000}
                  onChange={(e) =>
                    setInitParams({
                      ...initParams,
                      prizeAmount: parseFloat(e.target.value) * 1000000,
                    })
                  }
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Initialize Lottery'}
                </Button>
              </form>
            </Paper>
          ) : (
            <Box>
              {lottery.state === 'Active' && (
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h5" gutterBottom>
                    Buy Ticket
                  </Typography>
                  <form onSubmit={handleBuyTicket}>
                    <Typography>Enter your {lottery.sequenceLength} numbers (1-45):</Typography>
                    <Box display="flex" gap={1} my={2}>
                      {Array.from({ length: lottery.sequenceLength }).map((_, idx) => (
                        <TextField
                          key={idx}
                          type="number"
                          value={ticketSequence[idx] || ''}
                          onChange={(e) =>
                            handleSequenceChange(idx, parseInt(e.target.value))
                          }
                          inputProps={{ min: 1, max: 45 }}
                          sx={{ width: 70 }}
                        />
                      ))}
                    </Box>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Buy Ticket'}
                    </Button>
                  </form>
                </Paper>
              )}

              {lottery.authority && (
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h5" gutterBottom>
                    Reveal Next Number
                  </Typography>
                  <form onSubmit={handleRevealNumber}>
                    <TextField
                      label="Random Seed"
                      type="number"
                      fullWidth
                      margin="normal"
                      value={randomSeed}
                      onChange={(e) => setRandomSeed(parseInt(e.target.value))}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={
                        loading ||
                        lottery.state !== 'Active' ||
                        lottery.currentRevealIndex >= lottery.sequenceLength
                      }
                    >
                      {loading ? <CircularProgress size={24} /> : 'Reveal Number'}
                    </Button>
                  </form>
                </Paper>
              )}

              <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Transfer Ticket
                </Typography>
                <form onSubmit={handleTransferTicket}>
                  <TextField
                    label="Ticket ID"
                    fullWidth
                    margin="normal"
                    value={transferData.ticketId}
                    onChange={(e) =>
                      setTransferData({ ...transferData, ticketId: e.target.value })
                    }
                  />
                  <TextField
                    label="New Owner Public Key"
                    fullWidth
                    margin="normal"
                    value={transferData.newOwner}
                    onChange={(e) =>
                      setTransferData({ ...transferData, newOwner: e.target.value })
                    }
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading || lottery.state !== 'Active'}
                    sx={{ mt: 2 }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Transfer Ticket'}
                  </Button>
                </form>
              </Paper>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  )
}