/**
 * Demonstrates how to create new SPL tokens (aka "minting tokens") into an existing SPL Token Mint
 */

// import custom helpers for demos
import { payer, connection } from "@/lib/vars";
import { explorerURL, loadPublicKeysFromFile, printConsoleSeparator } from "@/lib/helpers";

import { PublicKey } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";

(async () => {
  printConsoleSeparator("🪙 Minting SPL Tokens");
  
  console.log("📋 Configuration:");
  console.log("   Payer address:", payer.publicKey.toBase58());

  printConsoleSeparator("📁 Loading Saved Keys");

  // load the stored PublicKeys for ease of use
  let localKeys = loadPublicKeysFromFile();

  // ensure the desired script was already run
  if (!localKeys?.tokenMint) {
    console.error("❌ No local keys were found!");
    console.log("💡 Please run '3.createTokenWithMetadata.ts' first");
    return;
  }

  const tokenMint: PublicKey = localKeys.tokenMint;

  console.log("✅ Local PublicKeys loaded successfully");
  console.log("🪙 Token mint address:", tokenMint.toBase58());
  console.log("🔗 Explorer:", explorerURL({ address: tokenMint.toBase58() }));

  printConsoleSeparator("🏦 Setting up Token Account");

  console.log("📝 About Associated Token Accounts (ATAs):");
  console.log("   • SPL tokens are stored in Associated Token Accounts");
  console.log("   • Each user has one ATA per token mint");
  console.log("   • The ATA is owned by the user's wallet");
  
  console.log("🔍 Getting or creating ATA for token mint...");
  /**
   * SPL tokens are owned using a special relationship where the actual tokens
   * are stored/owned by a different account, which is then owned by the user's
   * wallet/account
   * This special account is called "associated token account" (or "ata" for short)
   * ---
   * think of it like this: tokens are stored in the ata for each "tokenMint",
   * the ata is then owned by the user's wallet
   */

  // get or create the token's ata
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    tokenMint,
    payer.publicKey,
  ).then(ata => ata.address);

  /*
    note: when creating an ata, the instruction will allocate space on chain
    if you attempt to allocate space at an existing address on chain, the transaction will fail.
    ---
    sometimes, it may be useful to directly create the ata when you know it has not already been created on chain
    you can see how to do that below
  */

  // directly create the ata
  // const tokenAccount = await createAccount(connection, payer, tokenMint, payer.publicKey);

  console.log("✅ Token account ready");
  console.log("   ATA address:", tokenAccount.toBase58());

  printConsoleSeparator("🏭 Minting Tokens");
  
  console.log("📝 Understanding Token Decimals:");
  console.log("   • Token amounts include decimal places from the mint");
  console.log("   • If decimals=2, amount=1_000 → actual tokens = 10.00");
  console.log("   • If decimals=2, amount=10_000 → actual tokens = 100.00");
  console.log("   • If decimals=2, amount=10 → actual tokens = 0.10");
  /**
   * The number of tokens to mint takes into account the `decimal` places set on your `tokenMint`.
   * So ensure you are minting the correct, desired number of tokens.
   * ---
   * examples:
   * - if decimals=2, amount=1_000 => actual tokens minted == 10
   * - if decimals=2, amount=10_000 => actual tokens minted == 100
   * - if decimals=2, amount=10 => actual tokens minted == 0.10
   */

  const amountOfTokensToMint = 1_000_000_000_000_000_000_000_000;

  console.log("🪙 Minting Configuration:");
  console.log("   Raw amount to mint:", amountOfTokensToMint.toLocaleString());
  console.log("   Actual tokens (with 2 decimals):", (amountOfTokensToMint / 100).toLocaleString());

  // mint some token to the "ata"
  console.log("🚀 Executing mint transaction...");
  const mintSig = await mintTo(
    connection,
    payer,
    tokenMint,
    tokenAccount,
    payer,
    amountOfTokensToMint,
  );

  printConsoleSeparator("✅ Success!");
  console.log("🎉 Tokens minted successfully!");
  console.log("📋 Transaction Details:");
  console.log("   Signature:", mintSig);
  console.log("   🔗 Explorer:", explorerURL({ txSignature: mintSig }));
  console.log("🪙 Minting Summary:");
  console.log("   Amount minted:", (amountOfTokensToMint / 100).toLocaleString(), "tokens");
  console.log("   Recipient ATA:", tokenAccount.toBase58());
})();
