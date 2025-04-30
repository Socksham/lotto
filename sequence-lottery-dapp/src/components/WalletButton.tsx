import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Box, Button } from '@mui/material'

export const WalletButton = () => {
  const { wallet, connect, connecting, connected } = useWallet()

  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
      <WalletMultiButton
        style={{
          backgroundColor: '#512da8',
          color: 'white',
          fontFamily: 'inherit',
          height: '40px',
        }}
      >
        {!wallet ? 'Select Wallet' : connected ? 'Connected' : 'Connect'}
      </WalletMultiButton>
    </Box>
  )
}