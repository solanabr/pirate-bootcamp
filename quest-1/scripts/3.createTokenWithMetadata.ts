/**
 * Demonstrates how to create a SPL token and store it's metadata on chain (using the Metaplex MetaData program)
 */

// import custom helpers for demos
import { payer, testWallet, connection } from "@/lib/vars";

import {
  buildTransaction,
  explorerURL,
  extractSignatureFromFailedTransaction,
  printConsoleSeparator,
  savePublicKeyToFile,
} from "@/lib/helpers";

import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { MINT_SIZE, TOKEN_PROGRAM_ID, createInitializeMint2Instruction } from "@solana/spl-token";

import {
  PROGRAM_ID as METADATA_PROGRAM_ID,
  createCreateMetadataAccountV3Instruction,
} from "@metaplex-foundation/mpl-token-metadata";

(async () => {
  printConsoleSeparator("🏴‍☠️ Creating SPL Token with Metadata");
  
  console.log("📋 Configuration:");
  console.log("   Payer address:", payer.publicKey.toBase58());
  console.log("   Test wallet address:", testWallet.publicKey.toBase58());

  printConsoleSeparator("⚙️ Token Setup");

  // generate a new keypair to be used for our mint
  const mintKeypair = Keypair.generate();

  console.log("🪙 Generated new mint keypair");
  console.log("   Mint address:", mintKeypair.publicKey.toBase58());

  // define the assorted token config settings
  const tokenConfig = {
    // define how many decimals we want our tokens to have
    decimals: 9,
    //
    name: "Superteam Brasil Devs",
    //
    symbol: "STBR",
    //
    uri: "https://thisis.atest.superteam.com.br/info.json",
  };

  console.log("📝 Token Configuration:");
  console.log("   Name:", tokenConfig.name);
  console.log("   Symbol:", tokenConfig.symbol);
  console.log("   Decimals:", tokenConfig.decimals);
  console.log("   Metadata URI:", tokenConfig.uri);

  // image url: https://bafybeihkc3tu4ugc5camayoqw7tl2lahtzgm2kpiwps3itvfsv7zcmceji.ipfs.nftstorage.link/

  printConsoleSeparator("🔧 Building Instructions");
  
  console.log("📦 Step 1/3: Creating mint account instruction");
  /**
   * Build the 2 instructions required to create the token mint:
   * - standard "create account" to allocate space on chain
   * - initialize the token mint
   */

  // create instruction for the token mint account
  const createMintAccountInstruction = SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: mintKeypair.publicKey,
    // the `space` required for a token mint is accessible in the `@solana/spl-token` sdk
    space: MINT_SIZE,
    // store enough lamports needed for our `space` to be rent exempt
    lamports: await connection.getMinimumBalanceForRentExemption(MINT_SIZE),
    // tokens are owned by the "token program"
    programId: TOKEN_PROGRAM_ID,
  });

  console.log("🏭 Step 2/3: Creating initialize mint instruction");
  // Initialize that account as a Mint
  const initializeMintInstruction = createInitializeMint2Instruction(
    mintKeypair.publicKey,
    tokenConfig.decimals,
    payer.publicKey,
    payer.publicKey,
  );

  /**
   * Alternatively, you could also use the helper function from the
   * `@solana/spl-token` sdk to create and initialize the token's mint
   * ---
   * NOTE: this method is normally efficient since the payer would need to
   * sign and pay for multiple transactions to perform all the actions. It
   * would also require more "round trips" to the blockchain as well.
   * But this option is available, should it fit your use case :)
   * */

  /*
  console.log("Creating a token mint...");
  const mint = await createMint(
    connection,
    payer,
    // mint authority
    payer.publicKey,
    // freeze authority
    payer.publicKey,
    // decimals - use any number you desire
    tokenConfig.decimals,
    // manually define our token mint address
    mintKeypair,
  );
  console.log("Token's mint address:", mint.toBase58());
  */

  console.log("📋 Step 3/3: Creating metadata instruction");
  /**
   * Build the instruction to store the token's metadata on chain
   * - derive the pda for the metadata account
   * - create the instruction with the actual metadata in it
   */

  // derive the pda address for the Metadata account
  const metadataAccount = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), mintKeypair.publicKey.toBuffer()],
    METADATA_PROGRAM_ID,
  )[0];

  console.log("📍 Derived metadata PDA address:", metadataAccount.toBase58());

  // Create the Metadata account for the Mint
  const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataAccount,
      mint: mintKeypair.publicKey,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
    },
    {
      createMetadataAccountArgsV3: {
        data: {
          creators: null,
          name: tokenConfig.name,
          symbol: tokenConfig.symbol,
          uri: tokenConfig.uri,
          sellerFeeBasisPoints: 0,
          collection: null,
          uses: null,
        },
        // `collectionDetails` - for non-nft type tokens, normally set to `null` to not have a value set
        collectionDetails: null,
        // should the metadata be updatable?
        isMutable: true,
      },
    },
  );

  printConsoleSeparator("🚀 Transaction Execution");
  
  console.log("🔨 Building transaction with 3 instructions:");
  console.log("   1. Create mint account");
  console.log("   2. Initialize mint");
  console.log("   3. Create metadata account");
  /**
   * Build the transaction to send to the blockchain
   */

  const tx = await buildTransaction({
    connection,
    payer: payer.publicKey,
    signers: [payer, mintKeypair],
    instructions: [
      createMintAccountInstruction,
      initializeMintInstruction,
      createMetadataInstruction,
    ],
  });

  console.log("📡 Sending transaction to blockchain...");

  try {
    // actually send the transaction
    const sig = await connection.sendTransaction(tx);

    printConsoleSeparator("✅ Success!");
    console.log("🎉 Token with metadata created successfully!");
    console.log("📋 Transaction Details:");
    console.log("   Signature:", sig);
    console.log("   🔗 Explorer:", explorerURL({ txSignature: sig }));
    console.log("🪙 Token Details:");
    console.log("   Mint Address:", mintKeypair.publicKey.toBase58());
    console.log("   Metadata Address:", metadataAccount.toBase58());

    // locally save our addresses for the demo
    savePublicKeyToFile("tokenMint", mintKeypair.publicKey);
    console.log("💾 Token mint address saved locally for future scripts");
  } catch (err) {
    printConsoleSeparator("❌ Transaction Failed");
    console.error("🚨 Failed to send transaction:");
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
