import React from 'react'
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Chip,
} from '@mui/material'
import { useLottery } from '../contexts/LotteryContext'

export const TicketList = () => {
  const { lottery, tickets, loading, claimPrize } = useLottery()

  const isWinningTicket = (ticket: any) => {
    if (!lottery || lottery.currentRevealIndex === 0) return false

    for (let i = 0; i < lottery.currentRevealIndex; i++) {
      if (ticket.sequence[i] !== lottery.winningSequence[i]) {
        return false
      }
    }
    return true
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Your Tickets
        </Typography>
        {tickets.length === 0 ? (
          <Typography>No tickets purchased yet</Typography>
        ) : (
          <List>
            {tickets.map((ticket, index) => (
              <React.Fragment key={ticket.ticketId}>
                <ListItem
                  secondaryAction={
                    lottery?.state === 'Completed' &&
                    isWinningTicket(ticket) &&
                    !ticket.claimed && (
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => claimPrize(ticket.ticketId)}
                        disabled={loading}
                      >
                        Claim Prize
                      </Button>
                    )
                  }
                >
                  <ListItemText
                    primary={`Ticket #${ticket.ticketId}`}
                    secondary={
                      <Box>
                        <Box component="span" sx={{ display: 'flex', gap: 1, mb: 1 }}>
                          {ticket.sequence.slice(0, lottery?.sequenceLength || 0).map((num, idx) => (
                            <Chip
                              key={idx}
                              label={num}
                              color={
                                lottery &&
                                idx < lottery.currentRevealIndex &&
                                num === lottery.winningSequence[idx]
                                  ? 'success'
                                  : 'default'
                              }
                            />
                          ))}
                        </Box>
                        {ticket.claimed && (
                          <Chip label="Claimed" color="success" size="small" />
                        )}
                        {lottery?.state === 'Completed' &&
                          isWinningTicket(ticket) &&
                          !ticket.claimed && (
                            <Chip label="Winner!" color="warning" size="small" />
                          )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < tickets.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  )
}