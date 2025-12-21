import '@testing-library/jest-dom'

const { TextDecoder, TextEncoder } = require('util')

if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder
}

if (!global.TextDecoder) {
  global.TextDecoder = TextDecoder
}

jest.mock('next/image', () => {
  const React = require('react')
  return {
    __esModule: true,
    default: (props: any) =>
      React.createElement('img', { ...props, alt: props.alt || '' }),
  }
})

jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => {
    const DynamicComponent = () => null
    return DynamicComponent
  },
}))
