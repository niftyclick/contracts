import * as anchor from "@project-serum/anchor";
import { assert } from "chai";
import { Program } from "@project-serum/anchor";
import { Niftyclick } from "../target/types/niftyclick";
import fs from "fs";

const pathToMyKeypair = process.env.HOME + "/.config/solana/id.json";
const keypairFile = fs.readFileSync(pathToMyKeypair);
const secretKey = Buffer.from(JSON.parse(keypairFile.toString()));
const signerKeypair = anchor.web3.Keypair.fromSecretKey(secretKey);

describe("Start program", async () => {
	const idl = require("../target/idl/niftyclick.json");

	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	console.log("Signing Public Key :", provider.wallet.publicKey.toBase58());

	const programID = new anchor.web3.PublicKey(idl.metadata.address);
	const program = new anchor.Program(
		idl,
		programID,
		provider
	) as Program<Niftyclick>;

	console.log("Program interacting : ", programID.toBase58());

	const [linkAccount, _] = await anchor.web3.PublicKey.findProgramAddress(
		[Buffer.from("link_account"), signerKeypair.publicKey.toBuffer()],
		programID
	);

	const hackerman = new anchor.web3.Keypair();
	const added_content =
		"https://media.giphy.com/media/lgcUUCXgC8mEo/giphy.gif";

	it("Initialize PDA with 0 links.", async () => {
		await program.methods
			.initialize()
			.accounts({
				linkAccount,
				user: provider.wallet.publicKey,
				systemProgram: anchor.web3.SystemProgram.programId,
			})
			.signers([signerKeypair])
			.rpc();

		const account = await program.account.linkState.fetch(linkAccount);
		assert.equal(0, account.links.length);
	});

	it("Adds links to the PDA.", async () => {
		await program.methods
			.addLink(added_content.toString())
			.accounts({
				linkAccount,
				user: signerKeypair.publicKey,
			})
			.signers([signerKeypair])
			.rpc();

		const account = await program.account.linkState.fetch(linkAccount);
		assert.equal(1, account.links.length);
		assert.equal(added_content, account.links[0]);
	});

	it("Cannot add too long links to PDA.", async () => {
		await program.methods
			.addLink("x".repeat(201))
			.accounts({
				linkAccount,
				user: signerKeypair.publicKey,
			})
			.signers([signerKeypair])
			.rpc()
			.then(() => assert.ok(false))
			.catch(e => {
				console.log("Error :", e.error.errorMessage);
				assert.ok(true);
			});
	});

	it("Write access by other users not possible.", async () => {
		await program.methods
			.addLink("hello")
			.accounts({
				linkAccount,
				user: hackerman.publicKey,
			})
			.signers([hackerman])
			.rpc()
			.then(() => assert.ok(false))
			.catch(e => {
				console.log("Error :", e.error.errorMessage);
				assert.ok(true);
			});
	});

	it("Fradulent content not added.", async () => {
		const account = await program.account.linkState.fetch(linkAccount);
		assert.equal(1, account.links.length);
	});
});
