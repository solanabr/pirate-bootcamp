/**
 * Demonstrates how to update the metadata for an SPL token, using the Metaplex MetadataProgram
 */

// import custom helpers for demos
import { payer, connection } from "@/lib/vars";
import {
  buildTransaction,
  explorerURL,
  extractSignatureFromFailedTransaction,
  loadPublicKeysFromFile,
  printConsoleSeparator,
} from "@/lib/helpers";

import { PublicKey } from "@solana/web3.js";
import {
  PROGRAM_ID as METADATA_PROGRAM_ID,
  createUpdateMetadataAccountV2Instruction,
} from "@metaplex-foundation/mpl-token-metadata";

(async () => {
  printConsoleSeparator("📝 Updating Token Metadata");
  
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

  printConsoleSeparator("⚙️ New Metadata Configuration");

  // define the new token config settings
  const tokenConfig = {
    // new name
    name: "New Super Sweet Token",
    // new symbol
    symbol: "nSST",
    // new uri
    uri: "https://thisisnot.arealurl/new.json",
  };

  console.log("📝 Updated Token Configuration:");
  console.log("   New Name:", tokenConfig.name);
  console.log("   New Symbol:", tokenConfig.symbol);
  console.log("   New Metadata URI:", tokenConfig.uri);

  printConsoleSeparator("🔧 Building Update Instruction");
  
  console.log("🔍 Deriving metadata account PDA...");
  /**
   * Build the instruction to store the token's metadata on chain
   * - derive the pda for the metadata account
   * - create the instruction with the actual metadata in it
   */

  // derive the pda address for the Metadata account
  const metadataAccount = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), tokenMint.toBuffer()],
    METADATA_PROGRAM_ID,
  )[0];

  console.log("📍 Metadata PDA address:", metadataAccount.toBase58());

  console.log("📝 Creating metadata update instruction...");
  // Create the Metadata account for the Mint
  const updateMetadataInstruction = createUpdateMetadataAccountV2Instruction(
    {
      metadata: metadataAccount,
      updateAuthority: payer.publicKey,
    },
    {
      updateMetadataAccountArgsV2: {
        data: {
          creators: null,
          name: tokenConfig.name,
          symbol: tokenConfig.symbol,
          uri: tokenConfig.uri,
          sellerFeeBasisPoints: 0,
          collection: null,
          uses: null,
        },
        isMutable: true,
        primarySaleHappened: null,
        updateAuthority: payer.publicKey,
      },
    },
  );

  printConsoleSeparator("🚀 Transaction Execution");
  
  console.log("🔨 Building transaction with metadata update instruction");
  /**
   * Build the transaction to send to the blockchain
   */

  const tx = await buildTransaction({
    connection,
    payer: payer.publicKey,
    signers: [payer],
    instructions: [updateMetadataInstruction],
  });

  console.log("📡 Sending metadata update transaction...");

  try {
    // actually send the transaction
    const sig = await connection.sendTransaction(tx);

    printConsoleSeparator("✅ Success!");
    console.log("🎉 Token metadata updated successfully!");
    console.log("📋 Transaction Details:");
    console.log("   Signature:", sig);
    console.log("   🔗 Explorer:", explorerURL({ txSignature: sig }));
    console.log("📝 Updated Metadata:");
    console.log("   Token Name:", tokenConfig.name);
    console.log("   Token Symbol:", tokenConfig.symbol);
    console.log("   Metadata URI:", tokenConfig.uri);
    console.log("   Metadata Account:", metadataAccount.toBase58());

    // locally save our addresses for the demo
    // savePublicKeyToFile("tokenMint", mintKeypair.publicKey);
  } catch (err) {
    printConsoleSeparator("❌ Transaction Failed");
    console.error("🚨 Failed to send metadata update transaction:");
    console.error("Error details:", err);

    // attempt to extract the signature from the failed transaction
    const failedSig = await extractSignatureFromFailedTransaction(connection, err);
    if (failedSig) {
      console.log("🔍 Failed transaction signature:", failedSig);
      console.log("🔗 Explorer:", explorerURL({ txSignature: failedSig }));
    }

    throw err;
  }
})();
