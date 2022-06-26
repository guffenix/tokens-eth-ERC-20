const { expect } = require('chai')
const { ethers } = require('hardhat')

const initialSupply = 1000000
const tokenName = 'VirtualitoTKN'
const tokenSymbol = 'VTN'

describe('VirtualitoTKN token tests', function () {
  before(async function () {
    const availableSigners = await ethers.getSigners()
    this.deployer = availableSigners[0]

    const VirtualitoTKN = await ethers.getContractFactory('VirtualitoTKN')
    this.VirtualitoTKN = await VirtualitoTKN.deploy(initialSupply)
    await this.VirtualitoTKN.deployed()
  })

  it('Should be named VirtualitoTKN', async function () {
    const fetchedTokenName = await this.VirtualitoTKN.name()
    expect(fetchedTokenName).to.be.equal(tokenName)
  })

  it('Should have symbol "VTN"', async function () {
    const fetchedTokenSymbol = await this.VirtualitoTKN.symbol()
    expect(fetchedTokenSymbol).to.be.equal(tokenSymbol)
  })

  it('Should have totalSupply passed in during deploying', async function () {
    const [fetchedTotalSupply, decimals] = await Promise.all([
      this.VirtualitoTKN.totalSupply(),
      this.VirtualitoTKN.decimals(),
    ])
    const expectedTotalSupply = ethers.BigNumber.from(initialSupply).mul(
      ethers.BigNumber.from(10).pow(decimals),
    )
    expect(fetchedTotalSupply.eq(expectedTotalSupply)).to.be.true
  })
})
