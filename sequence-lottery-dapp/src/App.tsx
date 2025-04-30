import { Box, Container, CssBaseline, ThemeProvider, createTheme, Typography } from '@mui/material'
import { LotteryActions } from './components/LotteryActions'
import { TicketList } from './components/TicketList'

const theme = createTheme({
  palette: {
    primary: {
      main: '#512da8',
    },
    secondary: {
      main: '#ff5722',
    },
  },
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom align="center">
            Sequence Lottery
          </Typography>
          <LotteryActions />
          <TicketList />
        </Box>
      </Container>
    </ThemeProvider>
  )
}

export default App