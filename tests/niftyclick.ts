import * as anchor from "@project-serum/anchor";
import { assert } from "chai";
import { Program } from "@project-serum/anchor";
import { Niftyclick } from "../target/types/niftyclick";

describe("Start program", async () => {
	const idl: anchor.Idl = require("../target/idl/niftyclick.json");

	const provider: anchor.AnchorProvider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const programID = new anchor.web3.PublicKey(idl.metadata.address);
	const program = new anchor.Program(
		idl,
		programID,
		provider
	) as Program<Niftyclick>;

	const [linkAccount, linkAccountBump] =
		await anchor.web3.PublicKey.findProgramAddress(
			[Buffer.from("link_init"), provider.wallet.publicKey.toBuffer()],
			programID
		);

	it("Initialize PDA with 0 links", async () => {
		await program.methods
			.initialize(linkAccountBump)
			.accounts({
				linkAccount,
				user: provider.wallet.publicKey,
				systemProgram: anchor.web3.SystemProgram.programId,
			})
			.rpc();

		const account = await program.account.linkState.fetch(linkAccount);
		assert.equal(0, account.links.length);
	});

	it("Adds a link to the buffer account", async () => {
		await program.methods
			.addLink("https://media.giphy.com/media/lgcUUCXgC8mEo/giphy.gif")
			.accounts({
				linkAccount,
			})
			.rpc();

		const account = await program.account.linkState.fetch(linkAccount);
		assert.equal(1, account.links.length);
	});
});
