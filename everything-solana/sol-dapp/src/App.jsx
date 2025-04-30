// File: src/App.js
import React, { useState, useEffect } from 'react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { AnchorProvider, Program, web3, BN } from '@coral-xyz/anchor';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  CircularProgress, 
  TextField, 
  Grid, 
  Chip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

// Import the IDL for the lottery contract
import idl from './sequence_lottery.json';

// Set up the cluster API endpoint
const network = clusterApiUrl('devnet');
const connection = new Connection(network, 'processed');

// Customize the MUI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#512da8',
    },
    secondary: {
      main: '#7c4dff',
    },
  },
});

// Program ID from the deployed lottery contract
const programID = new PublicKey('BzGNGfCEfvbWYTByUicHR3MmcJYz9DwTMHvtrFmaBAgG');

// Wallet configuration
const wallets = [
  new PhantomWalletAdapter(),
];

function App() {
  return (
    <ThemeProvider theme={theme}>
      <ConnectionProvider endpoint={network}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <Content />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ThemeProvider>
  );
}

function Content() {
  const wallet = useWallet();
  const [lotteries, setLotteries] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lotteryForm, setLotteryForm] = useState({
    sequenceLength: 5,
    revealInterval: 3600, // 1 hour in seconds
    ticketPrice: 1, // In SOL
    prizeAmount: 10, // In SOL
  });
  const [ticketForm, setTicketForm] = useState({
    lotteryId: '',
    sequence: '1,2,3,4,5',
  });

  // Get the provider
  const getProvider = () => {
    if (!wallet.connected) return null;
    const provider = new AnchorProvider(
      connection, 
      wallet,
      { preflightCommitment: 'processed' }
    );
    return provider;
  };

  // Get the program instance
  const getProgram = () => {
    const provider = getProvider();
    if (!provider) return null;
    const prg = new Program(idl, provider)
    console.log(prg)
    return prg;
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Fetch all lotteries
  const fetchLotteries = async () => {
    try {
      setLoading(true);
      const program = getProgram();
      if (!program) return;

      // This is a mock - in a real app, you'd need to fetch lottery accounts
      // For demo purposes, we'll create mock data
      const mockLotteries = [
        {
          pubkey: new PublicKey('11111111111111111111111111111111'),
          account: {
            authority: wallet.publicKey,
            sequenceLength: 5,
            revealInterval: 3600,
            ticketPrice: new BN(1000000000), // 1 SOL in lamports
            prizeAmount: new BN(10000000000), // 10 SOL in lamports
            nextTicketId: new BN(5),
            winningSequence: [7, 12, 23, 32, 45, 0, 0, 0, 0, 0],
            currentRevealIndex: 3,
            lastRevealTimestamp: new BN(Date.now() / 1000 - 1800),
            state: { active: {} }
          }
        },
        {
          pubkey: new PublicKey('22222222222222222222222222222222'),
          account: {
            authority: wallet.publicKey,
            sequenceLength: 4,
            revealInterval: 1800,
            ticketPrice: new BN(500000000), // 0.5 SOL
            prizeAmount: new BN(5000000000), // 5 SOL
            nextTicketId: new BN(12),
            winningSequence: [3, 15, 27, 34, 0, 0, 0, 0, 0, 0],
            currentRevealIndex: 4,
            lastRevealTimestamp: new BN(Date.now() / 1000 - 900),
            state: { completed: {} }
          }
        }
      ];

      setLotteries(mockLotteries);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching lotteries:", error);
      setLoading(false);
    }
  };

  // Fetch user's tickets
  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      const program = getProgram();
      if (!program) return;

      // Mock data for tickets
      const mockTickets = [
        {
          pubkey: new PublicKey('33333333333333333333333333333333'),
          account: {
            owner: wallet.publicKey,
            lottery: new PublicKey('11111111111111111111111111111111'),
            ticketId: new BN(2),
            sequence: [7, 12, 23, 35, 41, 0, 0, 0, 0, 0],
            claimed: false
          }
        },
        {
          pubkey: new PublicKey('44444444444444444444444444444444'),
          account: {
            owner: wallet.publicKey,
            lottery: new PublicKey('22222222222222222222222222222222'),
            ticketId: new BN(5),
            sequence: [3, 15, 27, 34, 0, 0, 0, 0, 0, 0],
            claimed: false
          }
        }
      ];

      setMyTickets(mockTickets);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setLoading(false);
    }
  };

  // Create a new lottery
  const createLottery = async () => {
    try {
      setLoading(true);
      const program = getProgram();
      if (!program) return;

      const { sequenceLength, revealInterval, ticketPrice, prizeAmount } = lotteryForm;

      // Convert to the right format
      const sequenceLengthNum = parseInt(sequenceLength);
      const revealIntervalNum = parseInt(revealInterval);
      const ticketPriceLamports = new BN(parseFloat(ticketPrice) * web3.LAMPORTS_PER_SOL);
      const prizeAmountLamports = new BN(parseFloat(prizeAmount) * web3.LAMPORTS_PER_SOL);

      // Generate a keypair for the lottery account
      const lottery = web3.Keypair.generate();

      // This is a mock - in a real app, you'd call the program to create a lottery
      console.log("Creating lottery with params:", {
        sequenceLength: sequenceLengthNum,
        revealInterval: revealIntervalNum,
        ticketPrice: ticketPriceLamports.toString(),
        prizeAmount: prizeAmountLamports.toString()
      });

      // Mock successful creation
      alert("Lottery created successfully! (This is a mock)");
      fetchLotteries();
      setLoading(false);
    } catch (error) {
      console.error("Error creating lottery:", error);
      alert(`Error creating lottery: ${error.message}`);
      setLoading(false);
    }
  };

  // Buy a ticket
  const buyTicket = async () => {
    try {
      setLoading(true);
      const program = getProgram();
      if (!program) return;

      const { lotteryId, sequence } = ticketForm;
      
      // Parse the sequence string into an array of numbers
      const sequenceArray = sequence.split(',').map(num => parseInt(num.trim()));
      
      // Pad the array to 10 elements with zeros
      while (sequenceArray.length < 10) {
        sequenceArray.push(0);
      }

      // This is a mock - in a real app, you'd call the program to buy a ticket
      console.log("Buying ticket with params:", {
        lotteryId,
        sequence: sequenceArray
      });

      // Mock successful purchase
      alert("Ticket purchased successfully! (This is a mock)");
      fetchMyTickets();
      setLoading(false);
    } catch (error) {
      console.error("Error buying ticket:", error);
      alert(`Error buying ticket: ${error.message}`);
      setLoading(false);
    }
  };

  // Reveal the next number
  const revealNextNumber = async (lotteryPubkey) => {
    try {
      setLoading(true);
      const program = getProgram();
      if (!program) return;

      // Generate a random seed
      const randomSeed = Math.floor(Math.random() * 1000000);

      // This is a mock - in a real app, you'd call the program to reveal the next number
      console.log("Revealing next number for lottery:", lotteryPubkey.toString());

      // Mock successful reveal
      alert("Number revealed successfully! (This is a mock)");
      fetchLotteries();
      setLoading(false);
    } catch (error) {
      console.error("Error revealing number:", error);
      alert(`Error revealing number: ${error.message}`);
      setLoading(false);
    }
  };

  // Transfer a ticket
  const transferTicket = async (ticketPubkey) => {
    try {
      const newOwner = prompt("Enter the new owner's public key:");
      if (!newOwner) return;

      setLoading(true);
      const program = getProgram();
      if (!program) return;

      // This is a mock - in a real app, you'd call the program to transfer the ticket
      console.log("Transferring ticket to:", newOwner);

      // Mock successful transfer
      alert("Ticket transferred successfully! (This is a mock)");
      fetchMyTickets();
      setLoading(false);
    } catch (error) {
      console.error("Error transferring ticket:", error);
      alert(`Error transferring ticket: ${error.message}`);
      setLoading(false);
    }
  };

  // Claim a prize
  const claimPrize = async (ticketPubkey, lotteryPubkey) => {
    try {
      setLoading(true);
      const program = getProgram();
      if (!program) return;

      // This is a mock - in a real app, you'd call the program to claim the prize
      console.log("Claiming prize for ticket:", ticketPubkey.toString());

      // Mock successful claim
      alert("Prize claimed successfully! (This is a mock)");
      fetchMyTickets();
      setLoading(false);
    } catch (error) {
      console.error("Error claiming prize:", error);
      alert(`Error claiming prize: ${error.message}`);
      setLoading(false);
    }
  };

  // Load data when wallet connects
  useEffect(() => {
    if (wallet.connected) {
      fetchLotteries();
      fetchMyTickets();
    }
  }, [wallet.connected]);

  // Handle form changes
  const handleLotteryFormChange = (e) => {
    const { name, value } = e.target;
    setLotteryForm(prev => ({ ...prev, [name]: value }));
  };

  const handleTicketFormChange = (e) => {
    const { name, value } = e.target;
    setTicketForm(prev => ({ ...prev, [name]: value }));
  };

  // Format lamports to SOL
  const formatSol = (lamports) => {
    if (!lamports) return "0";
    return (lamports / web3.LAMPORTS_PER_SOL).toString();
  };

  // Get lottery status text
  const getLotteryStatusText = (lottery) => {
    if (lottery.account.state.active) {
      return `Active (${lottery.account.currentRevealIndex}/${lottery.account.sequenceLength} revealed)`;
    } else {
      return "Completed";
    }
  };

  // Get next reveal time
  const getNextRevealTime = (lottery) => {
    if (lottery.account.state.completed) {
      return "All numbers revealed";
    }
    
    const nextRevealTime = Number(lottery.account.lastRevealTimestamp) + Number(lottery.account.revealInterval);
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = nextRevealTime - now;
    
    if (timeLeft <= 0) {
      return "Ready to reveal";
    }
    
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Solana Sequence Lottery
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <WalletMultiButton />
        </Box>

        {wallet.connected ? (
          <>
            <Paper sx={{ width: '100%', mb: 4 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="primary"
                centered
              >
                <Tab label="Lotteries" />
                <Tab label="My Tickets" />
                <Tab label="Create Lottery" />
                <Tab label="Buy Ticket" />
              </Tabs>

              {/* Lotteries Tab */}
              {tabValue === 0 && (
                <Box sx={{ p: 3 }}>
                  <Typography variant="h5" component="h2" gutterBottom>
                    Active Lotteries
                  </Typography>
                  
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Sequence Length</TableCell>
                            <TableCell>Ticket Price</TableCell>
                            <TableCell>Prize</TableCell>
                            <TableCell>Next Reveal</TableCell>
                            <TableCell>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {lotteries.map((lottery) => (
                            <TableRow key={lottery.pubkey.toString()}>
                              <TableCell>{lottery.pubkey.toString().substring(0, 8)}...</TableCell>
                              <TableCell>{getLotteryStatusText(lottery)}</TableCell>
                              <TableCell>{lottery.account.sequenceLength}</TableCell>
                              <TableCell>{formatSol(lottery.account.ticketPrice)} SOL</TableCell>
                              <TableCell>{formatSol(lottery.account.prizeAmount)} SOL</TableCell>
                              <TableCell>{getNextRevealTime(lottery)}</TableCell>
                              <TableCell>
                                {lottery.account.state.active && (
                                  <Button
                                    variant="contained"
                                    size="small"
                                    color="primary"
                                    onClick={() => revealNextNumber(lottery.pubkey)}
                                    disabled={lottery.account.authority.toString() !== wallet.publicKey.toString()}
                                  >
                                    Reveal Next
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}

              {/* My Tickets Tab */}
              {tabValue === 1 && (
                <Box sx={{ p: 3 }}>
                  <Typography variant="h5" component="h2" gutterBottom>
                    My Tickets
                  </Typography>
                  
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Lottery</TableCell>
                            <TableCell>Sequence</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {myTickets.map((ticket) => {
                            const lottery = lotteries.find(l => l.pubkey.toString() === ticket.account.lottery.toString());
                            const isWinner = lottery && lottery.account.state.completed && 
                              ticket.account.sequence.slice(0, lottery.account.sequenceLength).every(
                                (num, i) => num === lottery.account.winningSequence[i]
                              );
                            
                            return (
                              <TableRow key={ticket.pubkey.toString()}>
                                <TableCell>{ticket.account.ticketId.toString()}</TableCell>
                                <TableCell>{ticket.account.lottery.toString().substring(0, 8)}...</TableCell>
                                <TableCell>
                                  {ticket.account.sequence.slice(0, lottery ? lottery.account.sequenceLength : 5).join(', ')}
                                </TableCell>
                                <TableCell>
                                  {ticket.account.claimed ? (
                                    <Chip label="Claimed" color="success" size="small" />
                                  ) : isWinner ? (
                                    <Chip label="Winner!" color="error" size="small" />
                                  ) : (
                                    <Chip label="Active" color="primary" size="small" />
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    {!ticket.account.claimed && (
                                      <Button
                                        variant="contained"
                                        size="small"
                                        color="secondary"
                                        onClick={() => transferTicket(ticket.pubkey)}
                                      >
                                        Transfer
                                      </Button>
                                    )}
                                    
                                    {isWinner && !ticket.account.claimed && (
                                      <Button
                                        variant="contained"
                                        size="small"
                                        color="success"
                                        onClick={() => claimPrize(ticket.pubkey, ticket.account.lottery)}
                                      >
                                        Claim
                                      </Button>
                                    )}
                                  </Box>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}

              {/* Create Lottery Tab */}
              {tabValue === 2 && (
                <Box sx={{ p: 3 }}>
                  <Typography variant="h5" component="h2" gutterBottom>
                    Create New Lottery
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Sequence Length (1-10)"
                        name="sequenceLength"
                        type="number"
                        value={lotteryForm.sequenceLength}
                        onChange={handleLotteryFormChange}
                        InputProps={{ inputProps: { min: 1, max: 10 } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Reveal Interval (seconds)"
                        name="revealInterval"
                        type="number"
                        value={lotteryForm.revealInterval}
                        onChange={handleLotteryFormChange}
                        InputProps={{ inputProps: { min: 60 } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Ticket Price (SOL)"
                        name="ticketPrice"
                        type="number"
                        value={lotteryForm.ticketPrice}
                        onChange={handleLotteryFormChange}
                        InputProps={{ inputProps: { min: 0.001, step: 0.001 } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Prize Amount (SOL)"
                        name="prizeAmount"
                        type="number"
                        value={lotteryForm.prizeAmount}
                        onChange={handleLotteryFormChange}
                        InputProps={{ inputProps: { min: 0.001, step: 0.001 } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={createLottery}
                        disabled={loading}
                      >
                        {loading ? <CircularProgress size={24} /> : "Create Lottery"}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Buy Ticket Tab */}
              {tabValue === 3 && (
                <Box sx={{ p: 3 }}>
                  <Typography variant="h5" component="h2" gutterBottom>
                    Buy Lottery Ticket
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        select
                        fullWidth
                        label="Select Lottery"
                        name="lotteryId"
                        value={ticketForm.lotteryId}
                        onChange={handleTicketFormChange}
                        SelectProps={{ native: true }}
                      >
                        <option value="">Select a lottery</option>
                        {lotteries.filter(l => l.account.state.active).map((lottery) => (
                          <option key={lottery.pubkey.toString()} value={lottery.pubkey.toString()}>
                            {lottery.pubkey.toString().substring(0, 8)}... - {formatSol(lottery.account.ticketPrice)} SOL
                          </option>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Sequence (comma separated)"
                        name="sequence"
                        value={ticketForm.sequence}
                        onChange={handleTicketFormChange}
                        helperText="Enter numbers between 1-45, separated by commas"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={buyTicket}
                        disabled={loading || !ticketForm.lotteryId || !ticketForm.sequence}
                      >
                        {loading ? <CircularProgress size={24} /> : "Buy Ticket"}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Paper>
          </>
        ) : (
          <Box sx={{ textAlign: 'center', my: 8 }}>
            <Typography variant="h6" component="p" gutterBottom>
              Connect your wallet to interact with the lottery
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
}

export default App;