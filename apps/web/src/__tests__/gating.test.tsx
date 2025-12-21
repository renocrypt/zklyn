import { render, screen } from '@testing-library/react'
import Home from '@/app/page'
import * as wagmi from 'wagmi'

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
  freeClaimed: boolean
  freeBalance: bigint
  premiumBalance: bigint
  premiumPrice: bigint
  usdcBalance: bigint
  allowance: bigint
}>) => {
  const state = {
    freeClaimed: false,
    freeBalance: 0n,
    premiumBalance: 0n,
    premiumPrice: 100000000n,
    usdcBalance: 0n,
    allowance: 0n,
    ...overrides,
  }

  mockUseAccount.mockReturnValue({
    address: '0x1111111111111111111111111111111111111111',
    isConnected: true,
  })
  mockUseChainId.mockReturnValue(8453)
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
