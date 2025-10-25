/**
 * Introduction to the Solana web3.js
 * Demonstrates how to build a more complex transaction, with multiple instructions
 */

// import custom helpers for demos
import { payer, testWallet, connection, STATIC_PUBLICKEY, NONEX_PUBLICKEY } from "@/lib/vars";
import { explorerURL, printConsoleSeparator } from "@/lib/helpers";

import { SystemProgram, TransactionMessage, VersionedTransaction } from "@solana/web3.js";

(async () => {
  console.log("🚀 Starting complex transaction demo...");
  printConsoleSeparator();

  console.log("📋 Account Information:");
  console.log("  Payer address:", payer.publicKey.toBase58());
  console.log("  Test wallet address:", testWallet.publicKey.toBase58());
  console.log("  Static wallet address:", STATIC_PUBLICKEY.toBase58());

  // Check initial balances
  console.log("\n💰 Initial Balances:");
  const payerBalance = await connection.getBalance(payer.publicKey);
  const testWalletBalance = await connection.getBalance(testWallet.publicKey);
  const staticWalletBalance = await connection.getBalance(STATIC_PUBLICKEY);
  
  console.log(`  Payer: ${payerBalance / 1e9} SOL (${payerBalance} lamports)`);
  console.log(`  Test wallet: ${testWalletBalance / 1e9} SOL (${testWalletBalance} lamports)`);
  console.log(`  Static wallet: ${staticWalletBalance / 1e9} SOL (${staticWalletBalance} lamports)`);

  printConsoleSeparator();
  console.log("🏗️  Building Transaction Instructions...");

  /**
   * create a simple instruction (using web3.js) to create an account
   */
  console.log("\n1️⃣ Checking if test wallet account needs to be created:");

  // Check if the test wallet account already exists
  const testWalletAccountInfo = await connection.getAccountInfo(testWallet.publicKey);
  let createTestAccountIx = null;
  let accountCreationAmount = 0;

  if (testWalletAccountInfo === null) {
    console.log("   Test wallet account doesn't exist, creating account creation instruction...");
    
    const space = 0; // on-chain space to allocated (in number of bytes)
    console.log(`   Space to allocate: ${space} bytes`);

    // request the cost (in lamports) to allocate `space` number of bytes on chain
    const balanceForRentExemption = await connection.getMinimumBalanceForRentExemption(space);
    console.log(`   Rent exemption required: ${balanceForRentExemption} lamports (${balanceForRentExemption / 1e9} SOL)`);
    
    accountCreationAmount = balanceForRentExemption + 1_000_000;
    console.log(`   Total lamports for account: ${accountCreationAmount} (${accountCreationAmount / 1e9} SOL)`);
    console.log(`   Additional lamports: 2,000,000 (${2_000_000 / 1e9} SOL)`);

    // create this simple instruction using web3.js helper function
    createTestAccountIx = SystemProgram.createAccount({
      // `fromPubkey` - this account will need to sign the transaction
      fromPubkey: payer.publicKey,
      // `newAccountPubkey` - the account address to create on chain
      newAccountPubkey: testWallet.publicKey,
      // lamports to store in this account
      lamports: accountCreationAmount,
      // total space to allocate
      space,
      // the owning program for this account
      programId: SystemProgram.programId,
    });
    console.log("   ✅ Account creation instruction created");
  } else {
    console.log("   ⚠️  Test wallet account already exists, skipping account creation");
    console.log(`   Existing balance: ${testWalletAccountInfo.lamports} lamports (${testWalletAccountInfo.lamports / 1e9} SOL)`);
  }

  // create an instruction to transfer lamports
  console.log("\n2️⃣ Creating first transfer instruction (to test wallet):");
  const baseTransferAmount = 100_000;
  const transferToTestWalletAmount = baseTransferAmount;
  console.log(`   Transfer amount: ${transferToTestWalletAmount} lamports (${transferToTestWalletAmount / 1e9} SOL)`);
  console.log(`   From: ${payer.publicKey.toBase58()}`);
  console.log(`   To: ${testWallet.publicKey.toBase58()}`);
  
  const transferToTestWalletIx = SystemProgram.transfer({
    lamports: transferToTestWalletAmount,
    // `fromPubkey` - from MUST sign the transaction
    fromPubkey: payer.publicKey,
    // `toPubkey` - does NOT have to sign the transaction
    toPubkey: testWallet.publicKey,
    programId: SystemProgram.programId,
  });
  console.log("   ✅ First transfer instruction created");

  // create an other instruction to transfer lamports
  console.log("\n3️⃣ Creating second transfer instruction (to static wallet):");
  const transferToStaticWalletAmount = 100_000;
  console.log(`   Transfer amount: ${transferToStaticWalletAmount} lamports (${transferToStaticWalletAmount / 1e9} SOL)`);
  console.log(`   From: ${payer.publicKey.toBase58()}`);
  console.log(`   To: ${STATIC_PUBLICKEY.toBase58()}`);
  
  const transferToStaticWalletIx = SystemProgram.transfer({
    lamports: transferToStaticWalletAmount,
    // `fromPubkey` - from MUST sign the transaction
    fromPubkey: payer.publicKey,
    // `toPubkey` - does NOT have to sign the transaction
    toPubkey: STATIC_PUBLICKEY,
    programId: SystemProgram.programId,
  });

  const transferToErrorWalletIx = SystemProgram.transfer({
    lamports: transferToStaticWalletAmount,
    // `fromPubkey` - from MUST sign the transaction
    fromPubkey: payer.publicKey,
    // `toPubkey` - does NOT have to sign the transaction
    toPubkey: NONEX_PUBLICKEY,
    programId: SystemProgram.programId,
  });
  console.log("   ✅ Second transfer instruction created");

  /**
   * build the transaction to send to the blockchain
   */
  printConsoleSeparator();
  console.log("📦 Building Transaction...");

  // get the latest recent blockhash
  console.log("\n🔗 Getting latest blockhash...");
  let recentBlockhash = await connection.getLatestBlockhash().then(res => res.blockhash);
  console.log(`   Recent blockhash: ${recentBlockhash}`);

  // create a transaction message
  console.log("\n📋 Creating transaction message with instructions:");
  const instructions = [];
  let instructionCount = 1;
  
  // Conditionally add account creation instruction
  if (createTestAccountIx) {
    instructions.push(createTestAccountIx);
    console.log(`   ${instructionCount}. Create account for test wallet`);
    instructionCount++;
  }
  
  // Add transfer instructions
  instructions.push(
    transferToStaticWalletIx,
    transferToTestWalletIx,
    transferToStaticWalletIx
  );
  
  console.log(`   ${instructionCount}. Transfer ${transferToStaticWalletAmount} lamports to static wallet`);
  console.log(`   ${instructionCount + 1}. Transfer ${transferToTestWalletAmount} lamports to test wallet`);
  console.log(`   ${instructionCount + 2}. Transfer ${transferToStaticWalletAmount} lamports to error wallet (${NONEX_PUBLICKEY.toBase58()})`);
  console.log(`   Total instructions: ${instructions.length}`);
  
  const message = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash,
    instructions,
  }).compileToV0Message();

  /**
   * try changing the order of the instructions inside of the message above...
   * see what happens :)
   */

  // create a versioned transaction using the message
  console.log("\n🔐 Creating and signing transaction...");
  const tx = new VersionedTransaction(message);
  console.log("   Transaction created, preparing to sign...");

  // sign the transaction with our needed Signers (e.g. `payer` and `keypair`)
  console.log("   Signing with required signers:");
  console.log(`     - Payer: ${payer.publicKey.toBase58()}`);
  
  const signers = [payer];
  if (createTestAccountIx) {
    console.log(`     - Test wallet: ${testWallet.publicKey.toBase58()}`);
    signers.push(testWallet);
  }
  
  tx.sign(signers);
  console.log("   ✅ Transaction signed successfully");

  // Calculate total cost before sending
  const totalCost = accountCreationAmount + transferToTestWalletAmount + transferToStaticWalletAmount + transferToStaticWalletAmount;
  console.log(`\n💸 Transaction Summary:`);
  console.log(`   Total cost: ${totalCost} lamports (${totalCost / 1e9} SOL)`);
  
  if (accountCreationAmount > 0) {
    console.log(`   Account creation: ${accountCreationAmount} lamports`);
  }
  console.log(`   Transfer to test wallet: ${transferToTestWalletAmount} lamports`);
  console.log(`   Transfer to static wallet: ${transferToStaticWalletAmount} lamports`);
  console.log(`   Transfer to error wallet: ${transferToStaticWalletAmount} lamports`);

  // actually send the transaction
  console.log("\n🚀 Sending transaction to blockchain...");
  const sig = await connection.sendTransaction(tx);
  console.log(`   ✅ Transaction sent! Signature: ${sig}`);

  /**
   * display some helper text
   */
  printConsoleSeparator();

  console.log("✅ Transaction completed successfully!");
  console.log(`🔍 Explorer URL: ${explorerURL({ txSignature: sig })}`);

  // Check final balances
  console.log("\n💰 Final Balances:");
  const finalPayerBalance = await connection.getBalance(payer.publicKey);
  const finalTestWalletBalance = await connection.getBalance(testWallet.publicKey);
  const finalStaticWalletBalance = await connection.getBalance(STATIC_PUBLICKEY);
  
  console.log(`  Payer: ${finalPayerBalance / 1e9} SOL (${finalPayerBalance} lamports)`);
  console.log(`  Test wallet: ${finalTestWalletBalance / 1e9} SOL (${finalTestWalletBalance} lamports)`);
  console.log(`  Static wallet: ${finalStaticWalletBalance / 1e9} SOL (${finalStaticWalletBalance} lamports)`);

  // Show balance changes
  console.log("\n📊 Balance Changes:");
  const payerChange = finalPayerBalance - payerBalance;
  const testWalletChange = finalTestWalletBalance - testWalletBalance;
  const staticWalletChange = finalStaticWalletBalance - staticWalletBalance;
  
  console.log(`  Payer: ${payerChange >= 0 ? '+' : ''}${payerChange / 1e9} SOL (${payerChange >= 0 ? '+' : ''}${payerChange} lamports)`);
  console.log(`  Test wallet: ${testWalletChange >= 0 ? '+' : ''}${testWalletChange / 1e9} SOL (${testWalletChange >= 0 ? '+' : ''}${testWalletChange} lamports)`);
  console.log(`  Static wallet: ${staticWalletChange >= 0 ? '+' : ''}${staticWalletChange / 1e9} SOL (${staticWalletChange >= 0 ? '+' : ''}${staticWalletChange} lamports)`);

  printConsoleSeparator();
  console.log("🎉 Demo completed successfully!");
})().catch((error) => {
  console.error("❌ Error occurred during transaction:");
  console.error(error);
  process.exit(1);
});
