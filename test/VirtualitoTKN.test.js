const { expect } = require('chai')
const { ethers, upgrades } = require('hardhat')

const initialSupply = 1000000
const tokenName = 'VirtualitoTKN'
const tokenSymbol = 'VTN'

describe('VirtualitoTKN token tests', function () {
  let virtualitoTKNV1
  let virtualitoTKNV2
  let deployer
  let userAccount

  describe('First version of VirtualitoTKN tests', function () {
    before(async function () {
      const availableSigners = await ethers.getSigners()
      deployer = availableSigners[0]

      const VirtualitoTKN = await ethers.getContractFactory('VirtualitoTKN')

      // this.VirtualitoTKNV1 = await VirtualitoTKN.deploy(initialSupply);
      virtualitoTKNV1 = await upgrades.deployProxy(
        VirtualitoTKN,
        [initialSupply],
        { kind: 'uups' },
      )
      await virtualitoTKNV1.deployed()
    })

    it('Should be named VirtualitoTKN', async function () {
      const fetchedTokenName = await virtualitoTKNV1.name()
      expect(fetchedTokenName).to.be.equal(tokenName)
    })

    it('Should have symbol "VTN"', async function () {
      const fetchedTokenSymbol = await virtualitoTKNV1.symbol()
      expect(fetchedTokenSymbol).to.be.equal(tokenSymbol)
    })

    it('Should have totalSupply passed in during deployment', async function () {
      const [fetchedTotalSupply, decimals] = await Promise.all([
        virtualitoTKNV1.totalSupply(),
        virtualitoTKNV1.decimals(),
      ])
      const expectedTotalSupply = ethers.BigNumber.from(initialSupply).mul(
        ethers.BigNumber.from(10).pow(decimals),
      )
      expect(fetchedTotalSupply.eq(expectedTotalSupply)).to.be.true
    })

    it('Should run into an error when executing a function that does not exist', async function () {
      expect(() =>
        virtualitoTKNV1.mint(
          deployer.address,
          ethers.BigNumber.from(10).pow(18),
        ),
      ).to.throw()
    })
  })

  describe('Current version of Virtualito (v2) tests', function () {
    before(async function () {
      userAccount = (await ethers.getSigners())[1]

      const VirtualitoTKN = await ethers.getContractFactory('VirtualitoTKNV2')

      virtualitoTKNV2 = await upgrades.upgradeProxy(
        virtualitoTKNV1.address,
        VirtualitoTKN,
      )

      await virtualitoTKNV2.deployed()
    })

    it('Should has the same address, and keep the state as the previous version', async function () {
      const [totalSupplyForNewCongtractVersion, totalSupplyForPreviousVersion] =
        await Promise.all([
          virtualitoTKNV2.totalSupply(),
          virtualitoTKNV1.totalSupply(),
        ])
      expect(virtualitoTKNV1.address).to.be.equal(virtualitoTKNV2.address)
      expect(
        totalSupplyForNewCongtractVersion.eq(totalSupplyForPreviousVersion),
      ).to.be.equal(true)
    })

    it('Should revert when an account other than the owner is trying to mint tokens', async function () {
      const tmpContractRef = await virtualitoTKNV2.connect(userAccount)
      try {
        await tmpContractRef.mint(
          userAccount.address,
          ethers.BigNumber.from(10).pow(ethers.BigNumber.from(18)),
        )
      } catch (ex) {
        expect(ex.message).to.contain('reverted')
        expect(ex.message).to.contain('Ownable: caller is not the owner')
      }
    })

    it('Should mint tokens when the owner is executing the mint function', async function () {
      const amountToMint = ethers.BigNumber.from(10)
        .pow(ethers.BigNumber.from(18))
        .mul(ethers.BigNumber.from(10))
      const accountAmountBeforeMint = await virtualitoTKNV2.balanceOf(
        deployer.address,
      )
      const totalSupplyBeforeMint = await virtualitoTKNV2.totalSupply()
      await virtualitoTKNV2.mint(deployer.address, amountToMint)

      const newAccountAmount = await virtualitoTKNV2.balanceOf(deployer.address)
      const newTotalSupply = await virtualitoTKNV2.totalSupply()

      expect(newAccountAmount.eq(accountAmountBeforeMint.add(amountToMint))).to
        .be.true
      expect(newTotalSupply.eq(totalSupplyBeforeMint.add(amountToMint))).to.be
        .true
    })
  })
})
