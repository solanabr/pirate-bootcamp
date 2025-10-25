/**
 * Demonstrates how to mint NFTs and store their metadata on chain using the Metaplex MetadataProgram
 */

// import custom helpers for demos
import { payer, connection } from "@/lib/vars";
import { explorerURL, loadPublicKeysFromFile, printConsoleSeparator } from "@/lib/helpers";

import { PublicKey } from "@solana/web3.js";
import { Metaplex, keypairIdentity, mockStorage } from "@metaplex-foundation/js";

(async () => {
  printConsoleSeparator("🖼️ Creating NFTs with Metaplex");
  
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

  printConsoleSeparator("🚢 NFT Metadata Configuration");

  console.log("📝 About NFT Storage:");
  console.log("   • Using IPFS for decentralized storage");
  console.log("   • Checkout: https://nft.storage/ to help store images");
  /**
   * define our ship's JSON metadata
   * checkout: https://nft.storage/ to help store images
   */
  const metadata = {
    name: "Bootcampers Tech Floripa STBR",
    symbol: "TECHstbr",
    description:
      "hello I'm a test onchain hehe",
    image:
      "https://apricot-rainy-asp-810.mypinata.cloud/ipfs/bafybeidsooyychd5i46nxpaa4i3z2qppyv62eyux7dgbkkc2iin4ronedi",
  };
  
  console.log("🖼️ NFT Metadata:");
  console.log("   Name:", metadata.name);
  console.log("   Symbol:", metadata.symbol);
  console.log("   Description:", metadata.description);
  console.log("   Image URL:", metadata.image);
  
  // another ship: "https://bafybeiblld2wlxyivlivnhaqbcixhzxrodjzrycjkitz3kdmzj65gebwxe.ipfs.nftstorage.link/"
  // Captain Rajovenko: "https://bafybeihww4tue5pme3h2udqvkpfbzs5zf4h2pysuoowwofbbk372vvtmja.ipfs.nftstorage.link/"

  printConsoleSeparator("⚙️ Metaplex SDK Setup");
  
  console.log("🔧 Configuring Metaplex SDK:");
  console.log("   • Setting up keypair identity");
  console.log("   • Using mock storage for metadata (for demo purposes)");
  console.log("   • Note: In production, use proper IPFS storage");
  /**
   * Use the Metaplex sdk to handle most NFT actions
   */

  // create an instance of Metaplex sdk for use
  const metaplex = Metaplex.make(connection)
    // set our keypair to use, and pay for the transaction
    .use(keypairIdentity(payer))
    // define a storage mechanism to upload with
    .use(mockStorage());

  console.log("✅ Metaplex SDK configured successfully");

  printConsoleSeparator("☁️ Uploading Metadata");
  console.log("📤 Uploading JSON metadata using mock storage...");

  // upload the JSON metadata
  const { uri } = await metaplex.nfts().uploadMetadata(metadata);

  console.log("✅ Metadata uploaded successfully!");
  console.log("🔗 Metadata URI:", uri);

  printConsoleSeparator("🎨 Creating NFT");

  console.log("🚀 Creating NFT using Metaplex SDK...");
  console.log("📝 NFT Configuration:");
  console.log("   • Name:", metadata.name);
  console.log("   • Symbol:", metadata.symbol);
  console.log("   • Royalties: 5.00% (500 basis points)");
  console.log("   • Mutable: Yes");

  // create a new nft using the metaplex sdk
  const { nft, response } = await metaplex.nfts().create({
    uri,
    name: metadata.name,
    symbol: metadata.symbol,

    // `sellerFeeBasisPoints` is the royalty that you can define on nft
    sellerFeeBasisPoints: 500, // Represents 5.00%.

    //
    isMutable: true,
  });

  printConsoleSeparator("✅ NFT Created Successfully!");
  console.log("🎉 Your pirate ship NFT has been minted!");
  
  console.log("📋 NFT Details:");
  console.log("   Name:", nft.name);
  console.log("   Symbol:", nft.symbol);
  console.log("   Mint Address:", nft.address.toBase58());
  console.log("   Metadata URI:", nft.uri);
  console.log("   Update Authority:", nft.updateAuthorityAddress?.toBase58());
  console.log("   Is Mutable:", nft.isMutable);
  console.log("   Primary Sale Happened:", nft.primarySaleHappened);
  console.log("   Seller Fee Basis Points:", nft.sellerFeeBasisPoints);

  console.log("📋 Transaction Details:");
  console.log("   Signature:", response.signature);
  console.log("   🔗 Explorer:", explorerURL({ txSignature: response.signature }));

  printConsoleSeparator("🔍 Optional: NFT Lookup Demo");
  console.log("💡 The code below demonstrates how to find NFT info by mint address");
  console.log("   (Currently commented out - uncomment to test)");
  
  return;

  /**
   * Optional: Demonstrate finding NFT by mint address
   * Uncomment the code below to test NFT lookup functionality
   */

  printConsoleSeparator("🔍 Finding NFT by Mint Address");
  console.log("🔎 Looking up NFT information...");

  // you can also use the metaplex sdk to retrieve info about the NFT's mint
  const mintInfo = await metaplex.nfts().findByMint({
    mintAddress: tokenMint,
  });
  
  console.log("📋 Found NFT Information:");
  console.log(mintInfo);
})();
