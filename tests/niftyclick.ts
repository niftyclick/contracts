import * as anchor from "@project-serum/anchor";
import { assert } from "chai";
import { Program } from "@project-serum/anchor";
import { Niftyclick } from "../target/types/niftyclick";

describe("Start program", async () => {
	const idl: anchor.Idl = require("../target/idl/niftyclick.json");

	const provider: anchor.AnchorProvider = anchor.AnchorProvider.env();
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
		[Buffer.from("link_account"), provider.wallet.publicKey.toBuffer()],
		programID
	);

	const added_content: String =
		"https://media.giphy.com/media/lgcUUCXgC8mEo/giphy.gif";

	it("Initialize PDA with 0 links.", async () => {
		await program.methods
			.initialize()
			.accounts({
				linkAccount,
				user: provider.wallet.publicKey,
				systemProgram: anchor.web3.SystemProgram.programId,
			})
			.rpc();

		const account = await program.account.linkState.fetch(linkAccount);
		assert.equal(0, account.links.length);
	});

	it("Adds links to the PDA.", async () => {
		await program.methods
			.addLink(added_content.toString())
			.accounts({
				linkAccount,
			})
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
			})
			.rpc()
			.then(() => assert.ok(false))
			.catch(() => assert.ok(true));
	});
});
