import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaErrors } from "../target/types/solana_errors";
import { Keypair, PublicKey, LAMPORTS_PER_SOL, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import { assert } from "chai";

describe("solana-errors", () => {

  anchor.setProvider(anchor.AnchorProvider.env());
  let connection = anchor.getProvider().connection;

  //@ts-ignore
  const program = anchor.workspace.SolanaErrors as Program<SolanaErrors>;
  const user = Keypair.generate();
  // const data = Keypair.generate();
  // const data1 = Keypair.generate();

  const [data] = PublicKey.findProgramAddressSync([Buffer.from("data")], program.programId);

  before("prepare", async () => await airdrop(connection, user.publicKey))

  it("Is initialized!", async () => {
    
    console.log("user balance = " + await connection.getBalance(user.publicKey))

    //method 1 passing {skipPreflight: true} to rpc method as an argument to get detailed logs

    const tx = await program.methods
      .initialize(10)
      .accountsStrict({
        user: user.publicKey,
        data: data,
        systemProgram: SystemProgram.programId
      })
      .signers([user])
      .rpc({commitment: "confirmed"});

      // const tx2 = await program.methods
      // .initialize()
      // .accountsStrict({
      //   user: user.publicKey,
      //   data: data1.publicKey,
      //   systemProgram: SystemProgram.programId
      // })
      // .signers([user, data1])
      // .rpc({skipPreflight: true});

      // method 2 using transaction method to get a detailed error messaged

      // const tx = await program.methods
      // .initialize()
      // .accountsStrict({
      //   user: user.publicKey,
      //   data: data.publicKey,
      //   systemProgram: SystemProgram.programId
      // })
      // .signers([user, data])
      // .transaction();

      // await sendAndConfirmTransaction(connection, tx, [user, data], {commitment: "confirmed"})

    console.log("Your transaction signature", tx);

    let dataAccount = await program.account.myData.fetch(data);
    assert.deepEqual(dataAccount.authority , user.publicKey);
    assert.strictEqual(dataAccount.counter, 0);
  });


  it("Cannot initialize with incorrect data account!", async () => {
    
    console.log("user balance = " + await connection.getBalance(user.publicKey))

    const data_account = Keypair.generate()

    try{
      const tx = await program.methods
        .initialize(1)
        .accountsStrict({
          user: user.publicKey,
          data: data_account.publicKey,
          systemProgram: SystemProgram.programId
        })
        .signers([user])
        .rpc();
  
        assert.fail();
    }catch(err){
      const error = anchor.AnchorError.parse(err.logs)

      assert.strictEqual(error.error.errorCode.code, "ConstraintSeeds");
    }
  });
});


async function airdrop(connection: any, address: any, amount = 1000000000) {
  await connection.confirmTransaction(await connection.requestAirdrop(address, amount), "confirmed");
}
