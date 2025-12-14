import { ethers } from "hardhat";

async function main() {
  console.log("Starting deployment...");

  // Token configuration
  const TOKEN_NAME = "USDT Token";
  const TOKEN_SYMBOL = "USDT";
  const INITIAL_SUPPLY = 10000000; // 1 million tokens

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy the token
  console.log("\nDeploying USDT...");
  const USDT = await ethers.getContractFactory("USDT");
  const token = await USDT.deploy(TOKEN_NAME, TOKEN_SYMBOL, INITIAL_SUPPLY);

  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();

  console.log("\n✅ Deployment successful!");
  console.log("=====================================");
  console.log("Token Name:", TOKEN_NAME);
  console.log("Token Symbol:", TOKEN_SYMBOL);
  console.log("Initial Supply:", INITIAL_SUPPLY);
  console.log("Token Address:", tokenAddress);
  console.log("Owner Address:", deployer.address);
  console.log("=====================================");

  // Verify token info
  const name = await token.name();
  const symbol = await token.symbol();
  const decimals = await token.decimals();
  const totalSupply = await token.totalSupply();

  console.log("\nToken Information:");
  console.log("Name:", name);
  console.log("Symbol:", symbol);
  console.log("Decimals:", decimals);
  console.log("Total Supply:", ethers.formatUnits(totalSupply, decimals));

  console.log("\n🎉 Deployment completed!");
  console.log("\nSave this information for verification:");
  console.log(`npx hardhat verify --network <network> ${tokenAddress} "${TOKEN_NAME}" "${TOKEN_SYMBOL}" ${INITIAL_SUPPLY}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
