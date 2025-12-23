import { render, screen } from '@testing-library/react'
import Home from '@/app/page'
import * as wagmi from 'wagmi'

jest.mock('@/config/web3', () => ({
  ACCESS_PASS_ADDRESS: '0x1111111111111111111111111111111111111111',
  USDC_ADDRESS: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  TREASURY_ADDRESS: '0x73871971f79673b8a57a48fb9e13a4ab7b25222e',
  PREMIUM_PRICE_FALLBACK: 100000000n,
}))

jest.mock('@/components/floating-nav', () => ({
  FloatingNav: () => null,
}))

jest.mock('motion/react', () => ({
  useReducedMotion: () => true,
}))

jest.mock('wagmi/chains', () => ({
  base: { id: 8453 },
  mainnet: { id: 1 },
}))

jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
  useChainId: jest.fn(),
  useConnect: jest.fn(),
  useDisconnect: jest.fn(),
  usePublicClient: jest.fn(),
  useReadContract: jest.fn(),
  useSwitchChain: jest.fn(),
  useWriteContract: jest.fn(),
}))

const mockUseAccount = wagmi.useAccount as jest.Mock
const mockUseChainId = wagmi.useChainId as jest.Mock
const mockUseConnect = wagmi.useConnect as jest.Mock
const mockUseDisconnect = wagmi.useDisconnect as jest.Mock
const mockUsePublicClient = wagmi.usePublicClient as jest.Mock
const mockUseReadContract = wagmi.useReadContract as jest.Mock
const mockUseSwitchChain = wagmi.useSwitchChain as jest.Mock
const mockUseWriteContract = wagmi.useWriteContract as jest.Mock

const setupWagmiMocks = (overrides?: Partial<{
  isConnected: boolean
  chainId: number
  freeClaimed: boolean
  freeBalance: bigint
  premiumBalance: bigint
  premiumPrice: bigint
  usdcBalance: bigint
  allowance: bigint
}>) => {
  const state = {
    isConnected: true,
    chainId: 8453,
    freeClaimed: false,
    freeBalance: 0n,
    premiumBalance: 0n,
    premiumPrice: 100000000n,
    usdcBalance: 0n,
    allowance: 0n,
    ...overrides,
  }

  mockUseAccount.mockReturnValue({
    address: state.isConnected ? '0x1111111111111111111111111111111111111111' : undefined,
    isConnected: state.isConnected,
  })
  mockUseChainId.mockReturnValue(state.chainId)
  mockUseConnect.mockReturnValue({
    connect: jest.fn(),
    connectors: [{ id: 'injected', name: 'Injected' }],
    isPending: false,
  })
  mockUseDisconnect.mockReturnValue({ disconnect: jest.fn() })
  mockUseSwitchChain.mockReturnValue({ switchChain: jest.fn(), isPending: false })
  mockUsePublicClient.mockReturnValue({ waitForTransactionReceipt: jest.fn() })
  mockUseWriteContract.mockReturnValue({
    writeContractAsync: jest.fn(),
    isPending: false,
  })

  mockUseReadContract.mockImplementation(({ functionName, args }: { functionName: string; args?: readonly unknown[] }) => {
    if (functionName === 'freeClaimed') {
      return { data: state.freeClaimed, refetch: jest.fn() }
    }

    if (functionName === 'balanceOf') {
      if (Array.isArray(args) && args.length === 2) {
        const tokenId = args[1]
        return {
          data: tokenId === 0n ? state.freeBalance : state.premiumBalance,
          refetch: jest.fn(),
        }
      }
      return { data: state.usdcBalance, refetch: jest.fn() }
    }

    if (functionName === 'allowance') {
      return { data: state.allowance, refetch: jest.fn() }
    }

    if (functionName === 'premiumPrice') {
      return { data: state.premiumPrice, refetch: jest.fn() }
    }

    return { data: undefined, refetch: jest.fn() }
  })
}

beforeEach(() => {
  jest.clearAllMocks()
})

test('shows free gallery unlocked when free pass is owned', () => {
  setupWagmiMocks({ freeBalance: 1n })
  render(<Home />)
  expect(
    screen.getByText('You have access to the base spatial gallery.')
  ).toBeInTheDocument()
  expect(
    screen.getByText('Mint premium to unlock this vault.')
  ).toBeInTheDocument()
})

test('shows the vault locked when disconnected', () => {
  setupWagmiMocks({ isConnected: false })
  render(<Home />)
  expect(
    screen.getByRole('button', { name: /connect to enter/i })
  ).toBeInTheDocument()
  expect(screen.getByText('Free Gallery')).toBeInTheDocument()
  expect(screen.getByText('Premium Vault')).toBeInTheDocument()
  expect(screen.getAllByRole('button', { name: /connect wallet/i })).toHaveLength(2)
})

test('shows the vault and prompts network switch on wrong chain', () => {
  setupWagmiMocks({ chainId: 1 })
  render(<Home />)
  expect(screen.getAllByRole('button', { name: /switch to base/i }).length).toBeGreaterThan(0)
  expect(screen.getByText('Free Gallery')).toBeInTheDocument()
  expect(screen.getByText('Premium Vault')).toBeInTheDocument()
})

test('renders futurist hero heading', () => {
  setupWagmiMocks()
  render(<Home />)
  expect(
    screen.getByRole('heading', { name: /access the vault/i })
  ).toBeInTheDocument()
})

test('shows premium vault unlocked when premium pass is owned', () => {
  setupWagmiMocks({ premiumBalance: 1n })
  render(<Home />)
  expect(screen.getByText('Premium assets unlocked.')).toBeInTheDocument()
})
